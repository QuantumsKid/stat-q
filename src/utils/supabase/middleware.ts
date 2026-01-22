import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  console.log(`[Supabase Middleware] Processing path: ${request.nextUrl.pathname}`);
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  console.log(`[Supabase Middleware] User authenticated: ${!!user}`);

  const protectedRoutes = ['/', '/forms']
  const isProtectedRoute = protectedRoutes.some(route =>
    request.nextUrl.pathname === route || (route !== '/' && request.nextUrl.pathname.startsWith(route))
  )
  console.log(`[Supabase Middleware] Path: ${request.nextUrl.pathname}, Is Protected: ${isProtectedRoute}`);


  // Redirect to login if accessing protected route without auth
  if (isProtectedRoute && !user) {
    console.log(`[Supabase Middleware] Redirecting to /login (protected route, no user)`);
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // Redirect to dashboard if authenticated user visits login
  if (request.nextUrl.pathname === '/login' && user) {
    console.log(`[Supabase Middleware] Redirecting from /login to dashboard (user authenticated)`);
    const redirectTo = request.nextUrl.searchParams.get('redirectTo')
    const url = request.nextUrl.clone()
    url.pathname = redirectTo || '/'
    url.search = ''
    return NextResponse.redirect(url)
  }

  console.log(`[Supabase Middleware] No redirect. Returning response for: ${request.nextUrl.pathname}`);
  return supabaseResponse
}
