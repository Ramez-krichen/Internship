import { NextRequest, NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

// GET /api/suppliers - List all suppliers
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
    const search = searchParams.get('search')

    const skip = (page - 1) * limit

    // Build where clause
    const where: any = {}
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { contactPerson: { contains: search, mode: 'insensitive' } }
      ]
    }

    const [suppliers, total] = await Promise.all([
      prisma.supplier.findMany({
        where,
        include: {
          items: {
            select: {
              id: true
            }
          },
          purchaseOrders: {
            select: {
              id: true,
              orderDate: true
            },
            orderBy: {
              orderDate: 'desc'
            },
            take: 1
          }
        },
        skip,
        take: limit,
        orderBy: { name: 'asc' }
      }),
      prisma.supplier.count({ where })
    ])

    // Transform data to match frontend interface
    const transformedSuppliers = suppliers.map(supplier => ({
      id: supplier.id,
      name: supplier.name,
      email: supplier.email || '',
      phone: supplier.phone || '',
      address: supplier.address || '',
      contactPerson: supplier.contactPerson || '',
      contactTitle: '', // Not in schema, default empty
      website: '', // Not in schema, default empty
      taxId: '', // Not in schema, default empty
      paymentTerms: 'Net 30', // Default payment terms
      itemsCount: supplier.items.length,
      totalOrders: supplier.purchaseOrders.length,
      lastOrderDate: supplier.purchaseOrders[0]?.orderDate.toISOString().split('T')[0] || '',
      status: 'Active' as const, // Default status
      rating: 0, // Default rating
      categories: [], // Default empty categories
      createdAt: supplier.createdAt.toISOString().split('T')[0],
      updatedAt: supplier.updatedAt.toISOString().split('T')[0],
      notes: '' // Default empty notes
    }))

    return NextResponse.json({
      suppliers: transformedSuppliers,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    })
  } catch (error) {
    console.error('Error fetching suppliers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch suppliers' },
      { status: 500 }
    )
  }
}

// POST /api/suppliers - Create new supplier
export async function POST(request: NextRequest) {
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

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        { error: 'Supplier name is required' },
        { status: 400 }
      )
    }

    // Check if supplier with same name already exists
    const existingSupplier = await prisma.supplier.findFirst({
      where: { name: { equals: name, mode: 'insensitive' } }
    })

    if (existingSupplier) {
      return NextResponse.json(
        { error: 'Supplier with this name already exists' },
        { status: 400 }
      )
    }

    const newSupplier = await prisma.supplier.create({
      data: {
        name,
        email: email || null,
        phone: phone || null,
        address: address || null,
        contactPerson: contactPerson || null
      }
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'Supplier',
        entityId: newSupplier.id,
        performedBy: session.user.id,
        details: `Created supplier: ${newSupplier.name}`
      }
    })

    return NextResponse.json(newSupplier, { status: 201 })
  } catch (error) {
    console.error('Error creating supplier:', error)
    return NextResponse.json(
      { error: 'Failed to create supplier' },
      { status: 500 }
    )
  }
}