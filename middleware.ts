import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  response.headers.set("x-pathname", request.nextUrl.pathname)

  let sessionCookie = request.cookies.get("fluxopay_session")
  let session = sessionCookie ? JSON.parse(sessionCookie.value) : null

  const publicRoutes = [
    "/login",
    "/esqueci-senha",
    "/redefinir-senha",
    "/setup",
    "/faq",
    "/termos",
    "/privacidade",
    "/contratos/assinar",
  ]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  // "/" é a landing page pública (marketing) quando não há sessão — usa comparação exata
  // (não startsWith) pra não acabar liberando toda rota do app sem querer.
  const isPublicRoot = request.nextUrl.pathname === "/"

  // Sessão criada antes da migração multi-tenant não tem empresaId no cookie — invalida em
  // vez de deixar o resto do app quebrar tentando filtrar por empresa undefined. Só força
  // redirect pra /login se o destino não for uma rota pública (senão a própria landing page
  // em "/" nunca aparecia pra quem tinha esse cookie antigo no navegador).
  if (session && !("empresaId" in session)) {
    session = null
    if (!isPublicRoute && !isPublicRoot) {
      const redirectResponse = NextResponse.redirect(new URL("/login", request.url))
      redirectResponse.cookies.delete("fluxopay_session")
      return redirectResponse
    }
    response.cookies.delete("fluxopay_session")
  }

  // Se não estiver logado e tentar acessar rota protegida, redirecionar para login
  if (!session && !isPublicRoute && !isPublicRoot) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Se estiver logado como Colaborador, só pode acessar meus-pagamentos, meus-contratos,
  // o link público de assinatura (que pode abrir estando logado, se clicar no próprio e-mail),
  // a página de autoatendimento da própria conta (perfil — já linkada na sidebar pra todo
  // mundo), o fluxo de recuperação de senha (pode abrir mesmo logado, ex. num outro
  // dispositivo) e o proxy de arquivos (nota fiscal, contrato assinado etc.), que o matcher
  // deste middleware intercepta como qualquer outra rota (não é asset estático) mas não é uma
  // "página" navegável, é o PDF que o próprio Colaborador anexou.
  if (session?.tipoAcesso === "Colaborador") {
    const rotasPermitidas = [
      "/meus-pagamentos",
      "/meus-contratos",
      "/contratos/assinar",
      "/perfil",
      "/esqueci-senha",
      "/redefinir-senha",
      "/api/files",
    ]
    if (!rotasPermitidas.some((rota) => request.nextUrl.pathname.startsWith(rota))) {
      return NextResponse.redirect(new URL("/meus-pagamentos", request.url))
    }
  }

  // Papel EHS só enxerga o módulo EHS — nunca rotas financeiras/contratuais. Esta é a camada
  // mais forte das três que restringem o papel (as outras duas são lib/nav-config.ts, que
  // nem lista os itens financeiros pra esse papel, e lib/ehs/permissions.ts, pro controle fino
  // de ação dentro do próprio módulo) — bloqueia no edge, antes de qualquer página carregar.
  if (session?.tipoAcesso === "EHS") {
    const rotasPermitidasEhs = ["/ehs", "/perfil", "/esqueci-senha", "/redefinir-senha", "/api/files"]
    if (!rotasPermitidasEhs.some((rota) => request.nextUrl.pathname.startsWith(rota))) {
      return NextResponse.redirect(new URL("/ehs", request.url))
    }
  }

  // /admin é exclusivo do time do FluWork (SuperAdmin) — qualquer outro papel é redirecionado.
  if (request.nextUrl.pathname.startsWith("/admin") && session?.tipoAcesso !== "SuperAdmin") {
    return NextResponse.redirect(new URL("/", request.url))
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
