import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/purchase-orders/[id] - Get purchase order by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const order = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contactPerson: true
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
                description: true
              }
            }
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Transform response
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      supplierId: order.supplierId,
      supplier: order.supplier,
      orderDate: order.orderDate.toISOString().split('T')[0],
      expectedDelivery: order.expectedDelivery?.toISOString().split('T')[0] || null,
      status: order.status,
      totalAmount: order.totalAmount,
      notes: order.notes || '',
      items: order.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        item: item.item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error fetching purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchase order' },
      { status: 500 }
    )
  }
}

// PUT /api/purchase-orders/[id] - Update purchase order
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      status,
      expectedDelivery,
      notes,
      items
    } = body

    // Check if order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        items: true
      }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Prepare update data
    const updateData: any = {}
    
    if (status !== undefined) {
      updateData.status = status
    }
    
    if (expectedDelivery !== undefined) {
      updateData.expectedDelivery = expectedDelivery ? new Date(expectedDelivery) : null
    }
    
    if (notes !== undefined) {
      updateData.notes = notes || null
    }

    // If items are being updated, recalculate total
    if (items && Array.isArray(items)) {
      const totalAmount = items.reduce((sum: number, item: any) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)
      updateData.totalAmount = totalAmount

      // Delete existing items and create new ones
      await prisma.purchaseOrderItem.deleteMany({
        where: { purchaseOrderId: params.id }
      })

      updateData.items = {
        create: items.map((item: any) => ({
          itemId: item.itemId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: item.quantity * item.unitPrice
        }))
      }
    }

    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: updateData,
      include: {
        supplier: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            contactPerson: true
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
                description: true
              }
            }
          }
        }
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'PurchaseOrder',
        entityId: updatedOrder.id,
        performedBy: session.user.id,
        details: `Updated purchase order: ${updatedOrder.orderNumber}`
      }
    })

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      supplierId: updatedOrder.supplierId,
      supplier: updatedOrder.supplier,
      orderDate: updatedOrder.orderDate.toISOString().split('T')[0],
      expectedDelivery: updatedOrder.expectedDelivery?.toISOString().split('T')[0] || null,
      status: updatedOrder.status,
      totalAmount: updatedOrder.totalAmount,
      notes: updatedOrder.notes || '',
      items: updatedOrder.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        item: item.item,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error updating purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to update purchase order' },
      { status: 500 }
    )
  }
}

// DELETE /api/purchase-orders/[id] - Delete purchase order
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if order exists
    const existingOrder = await prisma.purchaseOrder.findUnique({
      where: { id: params.id }
    })

    if (!existingOrder) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if order can be deleted (only draft orders)
    if (existingOrder.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'Only draft purchase orders can be deleted' },
        { status: 400 }
      )
    }

    // Delete order items first, then the order
    await prisma.purchaseOrderItem.deleteMany({
      where: { purchaseOrderId: params.id }
    })

    const deletedOrder = await prisma.purchaseOrder.delete({
      where: { id: params.id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'PurchaseOrder',
        entityId: deletedOrder.id,
        performedBy: session.user.id,
        details: `Deleted purchase order: ${deletedOrder.orderNumber}`
      }
    })

    return NextResponse.json({ message: 'Purchase order deleted successfully' })
  } catch (error) {
    console.error('Error deleting purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to delete purchase order' },
      { status: 500 }
    )
  }
}