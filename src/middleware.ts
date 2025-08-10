import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'
)

// Define public routes that don't require authentication
const publicPaths = ['/'] // Only root path (login page)

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  console.log(`Middleware running for: ${pathname}`) // Debug log

  // Allow public paths and API routes
  if (publicPaths.includes(pathname) || pathname.startsWith('/api/login')) {
    return NextResponse.next()
  }

  // Get token from cookie
  const token = request.cookies.get('admin_token')?.value

  // If no token and trying to access protected route, redirect to login
  if (!token) {
    console.log(`No token found, redirecting to login from: ${pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  try {
    // Verify the token
    await jwtVerify(token, JWT_SECRET)
    console.log(`Token valid, allowing access to: ${pathname}`)
    
    // Token is valid, continue to the requested page
    return NextResponse.next()
    
  } catch (error) {
    console.error('Middleware token verification failed:', error)
    
    // Token is invalid, redirect to login
    console.log(`Invalid token, redirecting to login from: ${pathname}`)
    const url = request.nextUrl.clone()
    url.pathname = '/'
    
    // Clear the invalid token cookie
    const response = NextResponse.redirect(url)
    response.cookies.set('admin_token', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 0,
      path: '/'
    })
    
    return response
  }
}

// Configure which routes the middleware should run on
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - Root path / (login page)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (images, etc.)
     * 
     * This will run on:
     * - All /dashboard/* routes
     * - All /api/* routes (so you can protect APIs too)
     * - Any other internal routes
     */
    '/((?!^/$|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
  ],
}