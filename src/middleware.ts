import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/utils/supabase/middleware';
// import createIntlMiddleware from 'next-intl/middleware'; // Commented out
// import { locales, defaultLocale } from './i18n/config'; // Commented out

// Create next-intl middleware
// const intlMiddleware = createIntlMiddleware({ // Commented out
//   locales,
//   defaultLocale,
//   localePrefix: 'as-needed',
// }); // Commented out

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Incoming request: ${request.nextUrl.pathname}`);

  // Only update Supabase session (next-intl temporarily disabled)
  const supabaseResponse = await updateSession(request);
  console.log(`[Middleware] After Supabase session update. Status: ${supabaseResponse?.status}`);
  console.log(`[Middleware] Returning Supabase response. Final URL: ${supabaseResponse.url}`);
  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
