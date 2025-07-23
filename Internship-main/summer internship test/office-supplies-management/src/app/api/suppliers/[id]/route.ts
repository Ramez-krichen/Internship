import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// GET /api/suppliers/[id] - Get supplier by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supplier = await prisma.supplier.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        purchaseOrders: {
          orderBy: { orderDate: 'desc' }
        }
      }
    })

    if (!supplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    return NextResponse.json(supplier)
  } catch (error) {
    console.error('Error fetching supplier:', error)
    return NextResponse.json(
      { error: 'Failed to fetch supplier' },
      { status: 500 }
    )
  }
}

// PUT /api/suppliers/[id] - Update supplier
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
      email,
      phone,
      address,
      contactPerson
    } = body

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: params.id }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if name is being changed and if it already exists
    if (name && name !== existingSupplier.name) {
      const duplicateSupplier = await prisma.supplier.findFirst({
        where: { 
          name: { equals: name, mode: 'insensitive' },
          id: { not: params.id }
        }
      })

      if (duplicateSupplier) {
        return NextResponse.json(
          { error: 'Supplier with this name already exists' },
          { status: 400 }
        )
      }
    }

    const updatedSupplier = await prisma.supplier.update({
      where: { id: params.id },
      data: {
        ...(name && { name }),
        ...(email !== undefined && { email: email || null }),
        ...(phone !== undefined && { phone: phone || null }),
        ...(address !== undefined && { address: address || null }),
        ...(contactPerson !== undefined && { contactPerson: contactPerson || null })
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'Supplier',
        entityId: updatedSupplier.id,
        performedBy: session.user.id,
        details: `Updated supplier: ${updatedSupplier.name}`
      }
    })

    return NextResponse.json(updatedSupplier)
  } catch (error) {
    console.error('Error updating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to update supplier' },
      { status: 500 }
    )
  }
}

// DELETE /api/suppliers/[id] - Delete supplier
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if supplier exists
    const existingSupplier = await prisma.supplier.findUnique({
      where: { id: params.id }
    })

    if (!existingSupplier) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }

    // Check if supplier has items or purchase orders
    const [itemCount, orderCount] = await Promise.all([
      prisma.item.count({ where: { supplierId: params.id } }),
      prisma.purchaseOrder.count({ where: { supplierId: params.id } })
    ])

    if (itemCount > 0 || orderCount > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete supplier with existing items or purchase orders',
          details: {
            itemCount,
            orderCount
          }
        },
        { status: 400 }
      )
    }

    // Safe to delete
    const deletedSupplier = await prisma.supplier.delete({
      where: { id: params.id }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'Supplier',
        entityId: deletedSupplier.id,
        performedBy: session.user.id,
        details: `Deleted supplier: ${deletedSupplier.name}`
      }
    })

    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error) {
    console.error('Error deleting supplier:', error)
    return NextResponse.json(
      { error: 'Failed to delete supplier' },
      { status: 500 }
    )
  }
}