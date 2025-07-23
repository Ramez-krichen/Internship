import { NextResponse } from 'next/server'

// GET /api/demo-users - Return the 3 main demo users for easy testing
export async function GET() {
  try {
    const demoUsers = [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'ADMIN',
        department: 'IT',
        description: 'Full system administrator with all permissions'
      },
      {
        id: 2,
        name: 'Manager User', 
        email: 'manager@example.com',
        password: 'manager123',
        role: 'MANAGER',
        department: 'Operations',
        description: 'Department manager with approval permissions'
      },
      {
        id: 3,
        name: 'John Employee',
        email: 'employee@example.com', 
        password: 'employee123',
        role: 'EMPLOYEE',
        department: 'Marketing',
        description: 'Regular employee who can create requests'
      }
    ]

    return NextResponse.json({
      success: true,
      message: 'Demo users for localhost:3000 testing',
      data: demoUsers,
      instructions: {
        usage: 'Use these credentials to login and test different user roles',
        loginUrl: '/auth/signin',
        note: 'These are demo accounts for development/testing purposes only'
      }
    })
  } catch (error) {
    return NextResponse.json(
      { 
        success: false,
        error: 'Failed to fetch demo users',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
