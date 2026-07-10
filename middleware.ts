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
  // as duas páginas de autoatendimento da própria conta (perfil e redefinir senha) — ambas já
  // linkadas na sidebar pra todo mundo — e o proxy de arquivos (nota fiscal, contrato assinado
  // etc.), que o matcher deste middleware intercepta como qualquer outra rota (não é asset
  // estático) mas não é uma "página" navegável, é o PDF que o próprio Colaborador anexou.
  if (session?.tipoAcesso === "Colaborador") {
    const rotasPermitidas = [
      "/meus-pagamentos",
      "/meus-contratos",
      "/contratos/assinar",
      "/perfil",
      "/redefinir-senha",
      "/api/files",
    ]
    if (!rotasPermitidas.some((rota) => request.nextUrl.pathname.startsWith(rota))) {
      return NextResponse.redirect(new URL("/meus-pagamentos", request.url))
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
