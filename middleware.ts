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

  // Sessão criada antes da migração multi-tenant não tem empresaId no cookie — força novo
  // login em vez de deixar o resto do app quebrar tentando filtrar por empresa undefined.
  if (session && !("empresaId" in session)) {
    session = null
    const redirectResponse = NextResponse.redirect(new URL("/login", request.url))
    redirectResponse.cookies.delete("fluxopay_session")
    return redirectResponse
  }

  const publicRoutes = ["/login", "/register", "/setup", "/faq", "/termos", "/privacidade", "/contratos/assinar"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))
  // "/" é a landing page pública (marketing) quando não há sessão — usa comparação exata
  // (não startsWith) pra não acabar liberando toda rota do app sem querer.
  const isPublicRoot = request.nextUrl.pathname === "/"

  // Se não estiver logado e tentar acessar rota protegida, redirecionar para login
  if (!session && !isPublicRoute && !isPublicRoot) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Se estiver logado como Colaborador, só pode acessar meus-pagamentos, meus-contratos
  // e o link público de assinatura (que pode abrir estando logado, se clicar no próprio e-mail).
  if (session?.tipoAcesso === "Colaborador") {
    const rotasPermitidas = ["/meus-pagamentos", "/meus-contratos", "/contratos/assinar"]
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
