import { NextRequest, NextResponse } from 'next/server'
import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'your-super-secret-key-change-this-in-production'
)

interface LoginRequest {
  adminId: string
  adminPassword: string
}

interface TokenPayload {
  adminId: string
  exp: number
  iat: number
}

export async function POST(request: NextRequest) {
  try {
    const body: LoginRequest = await request.json()
    const { adminId, adminPassword } = body

    // Validate required fields
    if (!adminId || !adminPassword) {
      return NextResponse.json(
        { success: false, message: 'Admin ID and password are required' },
        { status: 400 }
      )
    }

    // Validate credentials against environment variables
    const validAdminId = process.env.ADMIN_ID
    const validAdminPassword = process.env.ADMIN_PASSWORD

    if (!validAdminId || !validAdminPassword) {
      console.error('Admin credentials not configured in environment variables')
      return NextResponse.json(
        { success: false, message: 'Server configuration error' },
        { status: 500 }
      )
    }

    // Check credentials
    if (adminId !== validAdminId || adminPassword !== validAdminPassword) {
      return NextResponse.json(
        { success: false, message: 'Invalid admin credentials' },
        { status: 401 }
      )
    }

    // Create JWT token with 7 days expiry
    const token = await new SignJWT({ adminId })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('7d')
      .sign(JWT_SECRET)

    // Create response
    const response = NextResponse.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: 'admin',
        adminId
      }
    })

    // Set secure HTTP-only cookie
    const cookieStore = cookies()
    response.cookies.set('admin_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7, // 7 days in seconds
      path: '/'
    })

    return response

  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Utility function to verify JWT token
export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as TokenPayload
  } catch (error) {
    console.error('Token verification failed:', error)
    return null
  }
}

// Optional: Logout endpoint
export async function DELETE() {
  const response = NextResponse.json({ success: true, message: 'Logged out successfully' })
  
  // Clear the cookie
  response.cookies.set('admin_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  })

  return response
}