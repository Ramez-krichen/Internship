import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !['ADMIN', 'MANAGER'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const type = url.searchParams.get('type')
    const limit = parseInt(url.searchParams.get('limit') || '50')

    // Build where clause based on user role
    let where: any = {}

    if (session.user.role === 'ADMIN') {
      // Admins see all notifications
      where = {
        OR: [
          { targetRole: 'ADMIN' },
          { targetUserId: session.user.id }
        ]
      }
    } else if (session.user.role === 'MANAGER') {
      // Managers see notifications targeted to managers or specifically to them
      where = {
        OR: [
          { targetRole: 'MANAGER' },
          { targetUserId: session.user.id }
        ]
      }
    }

    if (status) {
      where.status = status
    }

    if (type) {
      where.type = type
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' }
      ],
      take: limit
    })

    // Get counts for different statuses using the same where clause
    const counts = await prisma.notification.groupBy({
      by: ['status'],
      where: where,
      _count: { id: true }
    })

    const statusCounts = counts.reduce((acc, item) => {
      acc[item.status] = item._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      notifications,
      counts: statusCounts,
      total: notifications.length
    })

  } catch (error) {
    console.error('Error fetching notifications:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
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
    const { type, title, message, data, priority, targetRole, targetUserId } = body

    // Validate required fields
    if (!type || !title || !message) {
      return NextResponse.json(
        { error: 'Type, title, and message are required' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        type,
        title,
        message,
        data: data ? JSON.stringify(data) : null,
        priority: priority || 'MEDIUM',
        targetRole: targetRole || 'ADMIN',
        targetUserId
      }
    })

    return NextResponse.json(notification, { status: 201 })

  } catch (error) {
    console.error('Error creating notification:', error)
    return NextResponse.json(
      { error: 'Failed to create notification' },
      { status: 500 }
    )
  }
}
