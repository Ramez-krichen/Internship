import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || 'month' // month, quarter, year
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    // Calculate date range based on period
    const now = new Date()
    let periodStart: Date
    let periodEnd: Date = now

    if (startDate && endDate) {
      periodStart = new Date(startDate)
      periodEnd = new Date(endDate)
    } else {
      switch (period) {
        case 'week':
          periodStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'quarter':
          periodStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1)
          break
        case 'year':
          periodStart = new Date(now.getFullYear(), 0, 1)
          break
        case 'month':
        default:
          periodStart = new Date(now.getFullYear(), now.getMonth(), 1)
          break
      }
    }

    // Get approved requests spending
    const approvedRequests = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        status: 'APPROVED'
      },
      include: {
        items: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        requester: {
          select: {
            name: true,
            department: true
          }
        }
      }
    })

    const requestsSpending = approvedRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get purchase orders spending
    const purchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: {
          gte: periodStart,
          lte: periodEnd
        },
        status: {
          in: ['SENT', 'CONFIRMED', 'RECEIVED'] // Only count orders that represent actual spending
        }
      },
      include: {
        supplier: {
          select: {
            name: true
          }
        },
        items: {
          include: {
            item: {
              include: {
                category: true
              }
            }
          }
        },
        createdBy: {
          select: {
            name: true,
            department: true
          }
        }
      }
    })

    const purchaseOrdersSpending = purchaseOrders.reduce((total, order) => {
      return total + order.totalAmount
    }, 0)

    // Calculate spending by type
    const spendingByType = [
      {
        type: 'Internal Requests',
        amount: requestsSpending,
        count: approvedRequests.length,
        description: 'Employee requests for office supplies'
      },
      {
        type: 'Purchase Orders',
        amount: purchaseOrdersSpending,
        count: purchaseOrders.length,
        description: 'Direct purchases from suppliers'
      }
    ]

    // Calculate spending by category (combining both sources)
    const categorySpending: Record<string, number> = {}
    
    // Add request items to category spending
    approvedRequests.forEach(request => {
      request.items.forEach(item => {
        const category = item.item.category?.name || 'Uncategorized'
        const cost = item.totalPrice || (item.item.price * item.quantity)
        categorySpending[category] = (categorySpending[category] || 0) + cost
      })
    })

    // Add purchase order items to category spending
    purchaseOrders.forEach(order => {
      order.items.forEach(item => {
        const category = item.item.category?.name || 'Uncategorized'
        categorySpending[category] = (categorySpending[category] || 0) + item.totalPrice
      })
    })

    const spendingByCategory = Object.entries(categorySpending)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Calculate spending by department
    const departmentSpending: Record<string, number> = {}
    
    // Add requests to department spending
    approvedRequests.forEach(request => {
      const department = request.requester?.department || 'Unknown'
      const cost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.item.price * item.quantity))
      }, 0)
      departmentSpending[department] = (departmentSpending[department] || 0) + cost
    })

    // Add purchase orders to department spending
    purchaseOrders.forEach(order => {
      const department = order.createdBy?.department || 'Unknown'
      departmentSpending[department] = (departmentSpending[department] || 0) + order.totalAmount
    })

    const spendingByDepartment = Object.entries(departmentSpending)
      .map(([department, amount]) => ({ department, amount }))
      .sort((a, b) => b.amount - a.amount)

    // Calculate spending by supplier (purchase orders only)
    const supplierSpending: Record<string, number> = {}
    purchaseOrders.forEach(order => {
      const supplier = order.supplier.name
      supplierSpending[supplier] = (supplierSpending[supplier] || 0) + order.totalAmount
    })

    const spendingBySupplier = Object.entries(supplierSpending)
      .map(([supplier, amount]) => ({ supplier, amount }))
      .sort((a, b) => b.amount - a.amount)

    const totalSpending = requestsSpending + purchaseOrdersSpending

    return NextResponse.json({
      summary: {
        totalSpending,
        requestsSpending,
        purchaseOrdersSpending,
        period: period,
        periodStart: periodStart.toISOString(),
        periodEnd: periodEnd.toISOString()
      },
      spendingByType,
      spendingByCategory,
      spendingByDepartment,
      spendingBySupplier,
      details: {
        requestsCount: approvedRequests.length,
        purchaseOrdersCount: purchaseOrders.length,
        categoriesCount: spendingByCategory.length,
        departmentsCount: spendingByDepartment.length,
        suppliersCount: spendingBySupplier.length
      }
    })
  } catch (error) {
    console.error('Error fetching spending report:', error)
    return NextResponse.json(
      { error: 'Failed to fetch spending report' },
      { status: 500 }
    )
  }
}
