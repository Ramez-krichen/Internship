import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    console.log('Session in /api/users:', session)

    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      console.log('Unauthorized access to /api/users. Session:', session)

      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const users = await prisma.user.findMany({
      // Removed the filter to display all users, including ADMINs
      // where: {
      //   role: {
      //     not: 'ADMIN',
      //   },
      // },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        department: true,
        status: true,
        lastSignIn: true,
        createdAt: true,
        updatedAt: true,
      },
    })

    // Sort users by role priority: ADMIN first, then MANAGER, then EMPLOYEE
    // Within each role, active users appear before inactive users
    const sortedUsers = users.sort((a, b) => {
      const roleOrder = { 'ADMIN': 0, 'MANAGER': 1, 'EMPLOYEE': 2 }
      const aRoleOrder = roleOrder[a.role as keyof typeof roleOrder] ?? 3
      const bRoleOrder = roleOrder[b.role as keyof typeof roleOrder] ?? 3

      // First, sort by role
      if (aRoleOrder !== bRoleOrder) {
        return aRoleOrder - bRoleOrder
      }

      // If roles are the same, sort by status (ACTIVE first, then INACTIVE)
      const statusOrder = { 'ACTIVE': 0, 'INACTIVE': 1 }
      const aStatusOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 2
      const bStatusOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 2

      if (aStatusOrder !== bStatusOrder) {
        return aStatusOrder - bStatusOrder
      }

      // If both role and status are the same, sort by name alphabetically
      return a.name.localeCompare(b.name)
    })

    return NextResponse.json(sortedUsers)
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, department, status } = body

    if (!name || !email || !password || !role || !department) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const hashedPassword = await bcrypt.hash(password, 10)

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        department,
        status: status || 'ACTIVE',
      },
    })

    return NextResponse.json(newUser, { status: 201 })
  } catch (error) {
    console.error('Error creating user:', error)
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}