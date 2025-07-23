import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const department = searchParams.get('department')
    const search = searchParams.get('search')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        {
          requester: {
            name: { contains: search, mode: 'insensitive' }
          }
        }
      ]
    }

    if (status) {
      where.status = status
    }

    if (priority) {
      where.priority = priority
    }

    if (department) {
      where.department = department
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {}
      
      if (startDate) {
        where.createdAt.gte = new Date(startDate)
      }
      
      if (endDate) {
        // Set to end of the day for the end date
        const endDateTime = new Date(endDate)
        endDateTime.setHours(23, 59, 59, 999)
        where.createdAt.lte = endDateTime
      }
    }

    const [requests, total] = await Promise.all([
      db.request.findMany({
        where,
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              email: true
            }
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  reference: true,
                  unit: true,
                  category: true
                }
              }
            }
          },
          approvals: {
            include: {
              approver: {
                select: {
                  id: true,
                  name: true,
                  email: true
                }
              }
            },
            orderBy: {
              level: 'asc'
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      db.request.count({ where })
    ])

    // Transform data to match frontend interface
    const transformedRequests = requests.map(request => {
      // Find the latest approval if any
      const latestApproval = request.approvals.length > 0 
        ? request.approvals[request.approvals.length - 1] 
        : null

      return {
        id: request.id,
        title: request.title,
        description: request.description || '',
        requester: request.requester.name || '',
        requesterId: request.requesterId,
        department: request.department || '',
        status: request.status,
        priority: request.priority,
        totalAmount: request.totalAmount,
        createdAt: request.createdAt.toISOString().split('T')[0],
        updatedAt: request.updatedAt.toISOString().split('T')[0],
        approvedBy: latestApproval?.status === 'APPROVED' ? latestApproval.approver.name : undefined,
        approvedAt: latestApproval?.status === 'APPROVED' ? latestApproval.updatedAt.toISOString().split('T')[0] : undefined,
        rejectedReason: latestApproval?.status === 'REJECTED' ? latestApproval.comments : undefined,
        items: request.items.map(item => ({
          id: item.id,
          name: item.item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.totalPrice,
          description: item.notes || undefined,
          category: item.item.category.name
        })),
        notes: request.description || undefined,
        expectedDelivery: undefined // Not in schema yet
      }
    })

    return NextResponse.json({
      requests: transformedRequests,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching requests:', error)
    return NextResponse.json(
      { error: 'Failed to fetch requests' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      title,
      description,
      department,
      priority,
      items
    } = body

    // Validate required fields
    if (!title || !department || !items || !items.length) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Calculate total amount
    const totalAmount = items.reduce(
      (sum: number, item: any) => sum + (item.quantity * item.unitPrice),
      0
    )

    // Create request with items
    const newRequest = await db.request.create({
      data: {
        title,
        description,
        department,
        priority: priority || 'MEDIUM',
        totalAmount,
        requesterId: session.user.id,
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            quantity: parseInt(item.quantity),
            unitPrice: parseFloat(item.unitPrice),
            totalPrice: parseFloat(item.quantity) * parseFloat(item.unitPrice),
            notes: item.notes
          }))
        }
      },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        items: {
          include: {
            item: true
          }
        }
      }
    })

    // Create approval for managers
    const managers = await db.user.findMany({
      where: {
        role: 'MANAGER'
      }
    })

    if (managers.length > 0) {
      await db.approval.create({
        data: {
          requestId: newRequest.id,
          approverId: managers[0].id, // Assign to first manager
          level: 1
        }
      })
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Request',
        entityId: newRequest.id,
        performedBy: session.user.id,
        details: `Created request: ${newRequest.title}`
      }
    })

    return NextResponse.json(newRequest, { status: 201 })
  } catch (error) {
    console.error('Error creating request:', error)
    return NextResponse.json(
      { error: 'Failed to create request' },
      { status: 500 }
    )
  }
}