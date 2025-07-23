import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/items/[id] - Get item by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const item = await prisma.item.findUnique({
      where: { id: params.id },
      include: {
        category: true,
        supplier: true
      }
    })

    if (!item) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    return NextResponse.json(item)
  } catch (error) {
    console.error('Error fetching item:', error)
    return NextResponse.json(
      { error: 'Failed to fetch item' },
      { status: 500 }
    )
  }
}

// PUT /api/items/[id] - Update item
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
      name,
      description,
      reference,
      unit,
      price,
      minStock,
      currentStock,
      categoryId,
      supplierId,
      isActive,
      isEcoFriendly,
      ecoRating,
      carbonFootprint,
      recyclable
    } = body

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: params.id }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check if reference is being changed and if it already exists
    if (reference && reference !== existingItem.reference) {
      const duplicateItem = await prisma.item.findUnique({
        where: { reference }
      })

      if (duplicateItem) {
        return NextResponse.json(
          { error: 'Item reference already exists' },
          { status: 400 }
        )
      }
    }

    const updatedItem = await prisma.item.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(reference && { reference }),
        ...(unit && { unit }),
        ...(price !== undefined && { price: parseFloat(price) }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) }),
        ...(currentStock !== undefined && { currentStock: parseInt(currentStock) }),
        ...(categoryId && { categoryId }),
        ...(supplierId && { supplierId }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
        ...(isEcoFriendly !== undefined && { isEcoFriendly: Boolean(isEcoFriendly) }),
        ...(ecoRating !== undefined && { ecoRating: ecoRating ? parseInt(ecoRating) : null }),
        ...(carbonFootprint !== undefined && { carbonFootprint: carbonFootprint ? parseFloat(carbonFootprint) : null }),
        ...(recyclable !== undefined && { recyclable: Boolean(recyclable) })
      },
      include: {
        category: true,
        supplier: true
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Item',
        entityId: updatedItem.id,
        performedBy: session.user.id,
        details: `Updated item: ${updatedItem.name}`
      }
    })

    return NextResponse.json(updatedItem)
  } catch (error) {
    console.error('Error updating item:', error)
    return NextResponse.json(
      { error: 'Failed to update item' },
      { status: 500 }
    )
  }
}

// DELETE /api/items/[id] - Delete item
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if item exists
    const existingItem = await prisma.item.findUnique({
      where: { id: params.id }
    })

    if (!existingItem) {
      return NextResponse.json({ error: 'Item not found' }, { status: 404 })
    }

    // Check if item is referenced in other tables
    const [requestItems, stockMovements, orderItems] = await Promise.all([
      prisma.requestItem.count({ where: { itemId: params.id } }),
      prisma.stockMovement.count({ where: { itemId: params.id } }),
      prisma.orderItem.count({ where: { itemId: params.id } })
    ])

    if (requestItems > 0 || stockMovements > 0 || orderItems > 0) {
      // Instead of deleting, deactivate the item
      const deactivatedItem = await prisma.item.update({
        where: { id: params.id },
        data: { isActive: false }
      })

      // Create audit log
      await prisma.auditLog.create({
        data: {
          action: 'DEACTIVATE',
          entity: 'Item',
          entityId: deactivatedItem.id,
          performedBy: session.user.id,
          details: `Deactivated item: ${deactivatedItem.name} (has references)`
        }
      })

      return NextResponse.json({ 
        message: 'Item deactivated instead of deleted due to existing references',
        item: deactivatedItem 
      })
    }

    // Safe to delete
    const deletedItem = await prisma.item.delete({
      where: { id: params.id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Item',
        entityId: deletedItem.id,
        performedBy: session.user.id,
        details: `Deleted item: ${deletedItem.name}`
      }
    })

    return NextResponse.json({ message: 'Item deleted successfully' })
  } catch (error) {
    console.error('Error deleting item:', error)
    return NextResponse.json(
      { error: 'Failed to delete item' },
      { status: 500 }
    )
  }
}