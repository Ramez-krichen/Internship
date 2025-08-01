import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// POST /api/purchase-orders/[id]/receive - Mark order as received
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user has permission to receive orders
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
    }

    // Find the purchase order
    const order = await prisma.purchaseOrder.findUnique({
      where: { id: params.id },
      include: {
        supplier: true,
        items: {
          include: {
            item: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Purchase order not found' }, { status: 404 })
    }

    // Check if order can be received (must be SENT or CONFIRMED)
    if (order.status !== 'SENT' && order.status !== 'CONFIRMED') {
      return NextResponse.json(
        { error: 'Only sent or confirmed orders can be marked as received' },
        { status: 400 }
      )
    }

    // Update order status to RECEIVED
    const updatedOrder = await prisma.purchaseOrder.update({
      where: { id: params.id },
      data: {
        status: 'RECEIVED',
        receivedDate: new Date(),
        updatedAt: new Date()
      },
      include: {
        supplier: true,
        items: {
          include: {
            item: true
          }
        }
      }
    })

    // Update inventory quantities for received items
    for (const orderItem of updatedOrder.items) {
      await prisma.item.update({
        where: { id: orderItem.itemId },
        data: {
          currentStock: {
            increment: orderItem.quantity
          }
        }
      })
    }

    // Log the action
    await prisma.auditLog.create({
      data: {
        action: 'RECEIVE_ORDER',
        entityType: 'PURCHASE_ORDER',
        entityId: params.id,
        userId: session.user.id,
        details: `Received purchase order: ${updatedOrder.orderNumber} from supplier: ${updatedOrder.supplier.name}`
      }
    })

    // Transform response
    const transformedOrder = {
      id: updatedOrder.id,
      orderNumber: updatedOrder.orderNumber,
      supplierId: updatedOrder.supplierId,
      supplier: updatedOrder.supplier.name,
      orderDate: updatedOrder.orderDate.toISOString().split('T')[0],
      expectedDate: updatedOrder.expectedDelivery?.toISOString().split('T')[0] || null,
      receivedDate: updatedOrder.receivedDate?.toISOString().split('T')[0] || null,
      status: updatedOrder.status,
      totalAmount: updatedOrder.totalAmount,
      notes: updatedOrder.notes || '',
      items: updatedOrder.items.map(item => ({
        id: item.id,
        itemId: item.itemId,
        name: item.item.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice
      })),
      itemsCount: updatedOrder.items.length,
      createdAt: updatedOrder.createdAt.toISOString(),
      updatedAt: updatedOrder.updatedAt.toISOString()
    }

    return NextResponse.json(transformedOrder)
  } catch (error) {
    console.error('Error receiving purchase order:', error)
    return NextResponse.json(
      { error: 'Failed to receive purchase order' },
      { status: 500 }
    )
  }
}