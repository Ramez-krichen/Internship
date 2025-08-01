import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/purchase-orders - List all purchase orders
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const supplierId = searchParams.get('supplierId')
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (status && status !== 'ALL') {
      where.status = status
    }
    
    if (supplierId) {
      where.supplierId = supplierId
    }
    
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } },
        { supplier: { name: { contains: search, mode: 'insensitive' } } }
      ]
    }

    const [orders, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          items: {
            include: {
              item: {
                select: {
                  id: true,
                  name: true,
                  reference: true,
                  unit: true
                }
              }
            }
          }
        },
        skip,
        take: limit,
        orderBy: { orderDate: 'desc' }
      }),
      prisma.purchaseOrder.count({ where })
    ])

    // Transform data to match frontend interface
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplierName: order.supplier.name,
      orderDate: order.orderDate.toISOString().split('T')[0],
      expectedDelivery: order.expectedDate?.toISOString().split('T')[0] || null,
      status: order.status,
      totalAmount: order.totalAmount,
      notes: order.notes || '',
      items: order.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.item.name,
        itemReference: item.item.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        unit: item.item.unit
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }))

    return NextResponse.json({
      orders: transformedOrders,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching purchase orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase orders' },
      { status: 500 }
    )
  }
}

// POST /api/purchase-orders - Create new purchase order
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      supplierId,
      expectedDelivery,
      notes,
      items
    } = body

    // Validate required fields
    if (!supplierId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'Supplier and items are required' },
        { status: 400 }
      )
    }

    // Validate supplier exists
    const supplier = await prisma.supplier.findUnique({
      where: { id: supplierId }
    })

    if (!supplier) {
      return NextResponse.json(
        { error: 'Supplier not found' },
        { status: 404 }
      )
    }

    // Validate all items exist
    const itemIds = items.map((item: any) => item.itemId)
    const existingItems = await prisma.item.findMany({
      where: { id: { in: itemIds } }
    })

    if (existingItems.length !== itemIds.length) {
      return NextResponse.json(
        { error: 'One or more items not found' },
        { status: 404 }
      )
    }

    // Generate order number
    const orderCount = await prisma.purchaseOrder.count()
    const orderNumber = `PO-${new Date().getFullYear()}-${String(orderCount + 1).padStart(4, '0')}`

    // Calculate total amount
    const totalAmount = items.reduce((sum: number, item: any) => {
      return sum + (item.quantity * item.unitPrice)
    }, 0)

    // Create purchase order with items
    const newOrder = await prisma.purchaseOrder.create({
      data: {
        orderNumber,
        supplierId,
        createdById: session.user.id,
        orderDate: new Date(),
        expectedDate: expectedDelivery ? new Date(expectedDelivery) : null,
        status: 'DRAFT',
        totalAmount,
        notes: notes || null,
        items: {
          create: items.map((item: any) => ({
            itemId: item.itemId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice
          }))
        }
      },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true
          }
        },
        items: {
          include: {
            item: {
              select: {
                id: true,
                name: true,
                reference: true,
                unit: true
              }
            }
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'PurchaseOrder',
        entityId: newOrder.id,
        performedBy: session.user.id,
        details: `Created purchase order: ${newOrder.orderNumber} for supplier: ${supplier.name}`
      }
    })

    // Transform response
    const transformedOrder = {
      id: newOrder.id,
      orderNumber: newOrder.orderNumber,
      supplierId: newOrder.supplierId,
      supplierName: newOrder.supplier.name,
      orderDate: newOrder.orderDate.toISOString().split('T')[0],
      expectedDelivery: newOrder.expectedDate?.toISOString().split('T')[0] || null,
      status: newOrder.status,
      totalAmount: newOrder.totalAmount,
      notes: newOrder.notes || '',
      items: newOrder.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        itemName: item.item.name,
        itemReference: item.item.reference,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
        unit: item.item.unit
      })),
      createdAt: newOrder.createdAt.toISOString(),
      updatedAt: newOrder.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder, { status: 201 })
  } catch (error) {
    console.error('Error creating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to create purchase order' },
      { status: 500 }
    )
  }
}