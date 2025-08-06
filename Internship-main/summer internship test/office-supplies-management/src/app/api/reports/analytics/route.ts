import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { checkAccess, createFeatureAccessCheck } from '@/lib/server-access-control'

export async function GET() {
  try {
    const accessCheck = await checkAccess(createFeatureAccessCheck('REPORTS', 'view')())
    if (!accessCheck.hasAccess) {
      return NextResponse.json({ error: accessCheck.error }, { status: accessCheck.status })
    }

    const { user, userRole, userDepartment, requiresDepartmentFiltering, additionalRestrictions } = accessCheck

    // Get current date and calculate date ranges
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1)

    // Monthly spending (current month) - Include both requests and purchase orders
    const currentMonthRequests = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: currentMonth,
        },
        // Filter by department for managers
        ...(requiresDepartmentFiltering && userDepartment && {
          requester: {
            OR: [
              { department: userDepartment },
              { departmentRef: { name: userDepartment } }
            ]
          }
        }),
        // Filter to personal requests only for employees
        ...(additionalRestrictions?.includes('personal_only') && {
          requesterId: user.id
        }),
        status: 'APPROVED'
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const currentMonthRequestSpending = currentMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get purchase orders spending for current month
    const currentMonthPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: {
          gte: currentMonth,
        },
        status: {
          in: ['ORDERED', 'RECEIVED'] // Only count orders that represent actual spending
        },
        // Filter by department for managers
        ...(requiresDepartmentFiltering && userDepartment && {
          createdBy: {
            OR: [
              { department: userDepartment },
              { departmentRef: { name: userDepartment } }
            ]
          }
        }),
        // Filter to personal purchase orders only for employees
        ...(additionalRestrictions?.includes('personal_only') && {
          createdById: user.id
        })
      }
    })

    const currentMonthPOSpending = currentMonthPurchaseOrders.reduce((total, order) => {
      return total + order.totalAmount
    }, 0)

    const currentMonthSpending = currentMonthRequestSpending + currentMonthPOSpending

    // Last month spending for comparison - Include both requests and purchase orders
    const lastMonthRequests = await prisma.request.findMany({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
        // Filter by department for managers
        ...(requiresDepartmentFiltering && userDepartment && {
          requester: {
            OR: [
              { department: userDepartment },
              { departmentRef: { name: userDepartment } }
            ]
          }
        }),
        // Filter to personal requests only for employees
        ...(additionalRestrictions?.includes('personal_only') && {
          requesterId: user.id
        }),
        status: 'APPROVED'
      },
      include: {
        items: {
          include: {
            item: true
          }
        }
      }
    })

    const lastMonthRequestSpending = lastMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
      }, 0)
    }, 0)

    // Get purchase orders spending for last month
    const lastMonthPurchaseOrders = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
        status: {
          in: ['ORDERED', 'RECEIVED']
        },
        // Filter by department for managers
        ...(requiresDepartmentFiltering && userDepartment && {
          createdBy: {
            OR: [
              { department: userDepartment },
              { departmentRef: { name: userDepartment } }
            ]
          }
        }),
        // Filter to personal purchase orders only for employees
        ...(additionalRestrictions?.includes('personal_only') && {
          createdById: user.id
        })
      }
    })

    const lastMonthPOSpending = lastMonthPurchaseOrders.reduce((total, order) => {
      return total + order.totalAmount
    }, 0)

    const lastMonthSpending = lastMonthRequestSpending + lastMonthPOSpending

    // Requests processed this month
    const requestsProcessed = await prisma.request.count({
      where: {
        createdAt: {
          gte: currentMonth,
        },
        status: 'APPROVED'
      }
    })

    // Last month requests for comparison
    const lastMonthRequestsCount = await prisma.request.count({
      where: {
        createdAt: {
          gte: lastMonth,
          lt: currentMonth,
        },
        status: 'APPROVED'
      }
    })

    // Items ordered this month
    const itemsOrdered = currentMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + requestItem.quantity
      }, 0)
    }, 0)

    // Last month items for comparison
    const lastMonthItems = lastMonthRequests.reduce((total, request) => {
      return total + request.items.reduce((itemTotal, requestItem) => {
        return itemTotal + requestItem.quantity
      }, 0)
    }, 0)

    // Average order value
    const avgOrderValue = requestsProcessed > 0 ? currentMonthSpending / requestsProcessed : 0
    const lastMonthAvgOrderValue = lastMonthRequestsCount > 0 ? lastMonthSpending / lastMonthRequestsCount : 0

    // Calculate percentage changes
    const spendingChange = lastMonthSpending > 0 ? ((currentMonthSpending - lastMonthSpending) / lastMonthSpending) * 100 : 0
    const requestsChange = lastMonthRequestsCount > 0 ? ((requestsProcessed - lastMonthRequestsCount) / lastMonthRequestsCount) * 100 : 0
    const itemsChange = lastMonthItems > 0 ? ((itemsOrdered - lastMonthItems) / lastMonthItems) * 100 : 0
    const avgOrderChange = lastMonthAvgOrderValue > 0 ? ((avgOrderValue - lastMonthAvgOrderValue) / lastMonthAvgOrderValue) * 100 : 0

    // Spending by category
    const categorySpending = await prisma.category.findMany({
      include: {
        items: {
          include: {
            requestItems: {
              where: {
                request: {
                  createdAt: {
                    gte: currentMonth,
                  },
                  status: 'APPROVED'
                }
              },
              include: {
                item: true
              }
            }
          }
        }
      }
    })

    const categoryData = categorySpending.map(category => {
      const amount = category.items.reduce((total, item) => {
        return total + item.requestItems.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (item.price * requestItem.quantity))
        }, 0)
      }, 0)
      return {
        name: category.name,
        amount: Math.round(amount)
      }
    }).filter(cat => cat.amount > 0)

    const totalCategorySpending = categoryData.reduce((total, cat) => total + cat.amount, 0)
    const topCategories = categoryData
      .map(cat => ({
        ...cat,
        percentage: totalCategorySpending > 0 ? Math.round((cat.amount / totalCategorySpending) * 100) : 0
      }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5)

    // Top suppliers
    const supplierData = await prisma.supplier.findMany({
      include: {
        items: {
          include: {
            requestItems: {
              where: {
                request: {
                  createdAt: {
                    gte: currentMonth,
                  },
                  status: 'APPROVED'
                }
              },
              include: {
                item: true,
                request: true
              }
            }
          }
        }
      }
    })

    const topSuppliers = supplierData.map(supplier => {
      const orders = new Set()
      const amount = supplier.items.reduce((total, item) => {
        return total + item.requestItems.reduce((itemTotal, requestItem) => {
          orders.add(requestItem.request.id)
          return itemTotal + (requestItem.totalPrice || (item.price * requestItem.quantity))
        }, 0)
      }, 0)
      return {
        name: supplier.name,
        orders: orders.size,
        amount: Math.round(amount)
      }
    })
      .filter(supplier => supplier.amount > 0)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 4)

    // Monthly trend (last 12 months) - Include both requests and purchase orders
    const monthlyTrend = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0)

      const monthRequests = await prisma.request.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          // Filter by department for managers
          ...(requiresDepartmentFiltering && userDepartment && {
            requester: {
              OR: [
                { department: userDepartment },
                { departmentRef: { name: userDepartment } }
              ]
            }
          }),
          // Filter to personal requests only for employees
          ...(additionalRestrictions?.includes('personal_only') && {
            requesterId: user.id
          }),
          status: 'APPROVED'
        },
        include: {
          items: {
            include: {
              item: true
            }
          }
        }
      })

      const monthRequestSpending = monthRequests.reduce((total, request) => {
        return total + request.items.reduce((itemTotal, requestItem) => {
          return itemTotal + (requestItem.totalPrice || (requestItem.item.price * requestItem.quantity))
        }, 0)
      }, 0)

      // Get purchase orders for this month
      const monthPurchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
          createdAt: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: {
            in: ['ORDERED', 'RECEIVED']
          },
          // Filter by department for managers
          ...(requiresDepartmentFiltering && userDepartment && {
            createdBy: {
              OR: [
                { department: userDepartment },
                { departmentRef: { name: userDepartment } }
              ]
            }
          }),
          // Filter to personal purchase orders only for employees
          ...(additionalRestrictions?.includes('personal_only') && {
            createdById: user.id
          })
        }
      })

      const monthPOSpending = monthPurchaseOrders.reduce((total, order) => {
        return total + order.totalAmount
      }, 0)

      const monthSpending = monthRequestSpending + monthPOSpending

      monthlyTrend.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        amount: Math.round(monthSpending)
      })
    }

    return NextResponse.json({
      reportCards: [
        {
          title: 'Monthly Spending',
          value: `$${currentMonthSpending.toLocaleString()}`,
          change: `${spendingChange >= 0 ? '+' : ''}${spendingChange.toFixed(1)}%`,
          changeType: spendingChange >= 0 ? 'increase' : 'decrease',
          description: 'Total spending this month',
        },
        {
          title: 'Requests Processed',
          value: requestsProcessed.toString(),
          change: `${requestsChange >= 0 ? '+' : ''}${requestsChange.toFixed(1)}%`,
          changeType: requestsChange >= 0 ? 'increase' : 'decrease',
          description: 'Requests completed this month',
        },
        {
          title: 'Items Ordered',
          value: itemsOrdered.toLocaleString(),
          change: `${itemsChange >= 0 ? '+' : ''}${itemsChange.toFixed(1)}%`,
          changeType: itemsChange >= 0 ? 'increase' : 'decrease',
          description: 'Total items ordered this month',
        },
        {
          title: 'Average Order Value',
          value: `$${avgOrderValue.toFixed(2)}`,
          change: `${avgOrderChange >= 0 ? '+' : ''}${avgOrderChange.toFixed(1)}%`,
          changeType: avgOrderChange >= 0 ? 'increase' : 'decrease',
          description: 'Average value per order',
        },
      ],
      topCategories,
      topSuppliers,
      monthlyTrend
    })
  } catch (error) {
    console.error('Error fetching analytics:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}