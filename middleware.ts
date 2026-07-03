import { NextResponse, type NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  response.headers.set("x-pathname", request.nextUrl.pathname)

  const sessionCookie = request.cookies.get("fluxopay_session")
  const session = sessionCookie ? JSON.parse(sessionCookie.value) : null

  const publicRoutes = ["/login", "/setup", "/faq", "/termos", "/privacidade"]
  const isPublicRoute = publicRoutes.some((route) => request.nextUrl.pathname.startsWith(route))

  // Se não estiver logado e tentar acessar rota protegida, redirecionar para login
  if (!session && !isPublicRoute) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  // Se estiver logado como Colaborador, só pode acessar meus-pagamentos
  if (session?.tipoAcesso === "Colaborador") {
    if (!request.nextUrl.pathname.startsWith("/meus-pagamentos")) {
      return NextResponse.redirect(new URL("/meus-pagamentos", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
}
