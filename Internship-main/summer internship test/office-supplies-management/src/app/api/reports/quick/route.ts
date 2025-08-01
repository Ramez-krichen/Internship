import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get period from query parameters
    const { searchParams } = new URL(request.url)
    const period = parseInt(searchParams.get('period') || '30')

    // Get current date for time-based queries
    const now = new Date()
    const periodStart = new Date(now.getTime() - (period * 24 * 60 * 60 * 1000))
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentYear = new Date(now.getFullYear(), 0, 1)

    // Consumption Report Data
    const totalItems = await prisma.item.count()
    
    // Get approved requests from selected period
    const approvedRequests = await prisma.request.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: periodStart
        }
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
            department: true
          }
        }
      }
    })

    // Calculate period-specific totals
    const totalConsumed = approvedRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => itemSum + requestItem.quantity, 0)
    }, 0)

    const periodTotalCost = approvedRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price))
      }, 0)
    }, 0)

    // Top departments by consumption with costs
    const departmentConsumption = approvedRequests.reduce((acc, request) => {
      const dept = request.requester?.department || 'Unknown'
      const requestTotal = request.items.reduce((sum, item) => sum + item.quantity, 0)
      const requestCost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.quantity * item.item.price))
      }, 0)

      if (!acc[dept]) {
        acc[dept] = { consumed: 0, cost: 0 }
      }
      acc[dept].consumed += requestTotal
      acc[dept].cost += requestCost
      return acc
    }, {} as Record<string, { consumed: number; cost: number }>)

    const topDepartments = Object.entries(departmentConsumption)
      .map(([department, data]) => ({
        department,
        consumed: data.consumed,
        cost: data.cost
      }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5)

    // Top items by consumption with costs and units
    const itemConsumption = approvedRequests.reduce((acc, request) => {
      request.items.forEach(requestItem => {
        const itemName = requestItem.item.name
        const category = requestItem.item.category?.name || 'Uncategorized'
        const unit = requestItem.item.unit
        const itemCost = requestItem.totalPrice || (requestItem.quantity * requestItem.item.price)

        if (!acc[itemName]) {
          acc[itemName] = {
            consumed: 0,
            category,
            unit,
            cost: 0
          }
        }
        acc[itemName].consumed += requestItem.quantity
        acc[itemName].cost += itemCost
      })
      return acc
    }, {} as Record<string, { consumed: number; category: string; unit: string; cost: number }>)

    const topItems = Object.entries(itemConsumption)
      .map(([name, data]) => ({
        name,
        consumed: data.consumed,
        category: data.category,
        unit: data.unit,
        cost: data.cost
      }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5)

    // Cost Analysis Data
    const requests = await prisma.request.findMany({
      where: {
        status: {
          in: ['APPROVED', 'COMPLETED']
        },
        createdAt: {
          gte: periodStart
        }
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
            department: true
          }
        }
      }
    })

    const totalCost = requests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price))
      }, 0)
    }, 0)
    
    const monthlyRequests = requests.filter(r => r.createdAt >= currentMonth)
    const monthlySpend = monthlyRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => {
        return itemSum + (requestItem.totalPrice || (requestItem.quantity * requestItem.item.price))
      }, 0)
    }, 0)

    // Cost by category with item counts
    const categorySpend = requests.reduce((acc, request) => {
      request.items.forEach(requestItem => {
        const category = requestItem.item.category?.name || 'Uncategorized'
        const itemCost = requestItem.totalPrice || (requestItem.quantity * requestItem.item.price)

        if (!acc[category]) {
          acc[category] = { cost: 0, itemCount: 0 }
        }
        acc[category].cost += itemCost
        acc[category].itemCount += 1
      })
      return acc
    }, {} as Record<string, { cost: number; itemCount: number }>)

    const costByCategory = Object.entries(categorySpend)
      .map(([category, data]) => ({
        category,
        cost: data.cost,
        itemCount: data.itemCount
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)

    // Cost by department with order counts
    const departmentSpend = requests.reduce((acc, request) => {
      const dept = request.requester?.department || 'Unknown'
      const requestCost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.quantity * item.item.price))
      }, 0)

      if (!acc[dept]) {
        acc[dept] = { cost: 0, orderCount: 0 }
      }
      acc[dept].cost += requestCost
      acc[dept].orderCount += 1
      return acc
    }, {} as Record<string, { cost: number; orderCount: number }>)

    const costByDepartment = Object.entries(departmentSpend)
      .map(([department, data]) => ({
        department,
        cost: data.cost,
        orderCount: data.orderCount
      }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)

    // Forecast Report Data
    // Get all items with their stock levels and units
    const itemsWithStock = await prisma.item.findMany({
      select: {
        id: true,
        name: true,
        currentStock: true,
        minStock: true,
        unit: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate predicted demand based on historical consumption with real item data
    const predictedDemand = Object.entries(itemConsumption)
      .map(([name, data]) => {
        const item = itemsWithStock.find(i => i.name === name)
        return {
          item: name,
          currentStock: item?.currentStock || 0,
          predicted: Math.round(data.consumed * 1.2), // 20% increase prediction
          category: data.category,
          unit: data.unit
        }
      })
      .sort((a, b) => b.predicted - a.predicted)
      .slice(0, 10)

    // Low stock alerts (items with stock below minimum or 10)
    const lowStockAlerts = itemsWithStock
      .filter(item => item.currentStock <= (item.minStock || 10))
      .map(item => ({
        item: item.name,
        currentStock: item.currentStock,
        minimumStock: item.minStock || 10,
        unit: item.unit,
        category: item.category?.name || 'Uncategorized'
      }))
      .slice(0, 10)

    // Seasonal trends (simplified - based on monthly data)
    const seasonalTrends = [
      { month: 'Current', trend: 'High', factor: 1.2 },
      { month: 'Next', trend: 'Medium', factor: 1.0 },
      { month: 'Following', trend: 'Low', factor: 0.8 }
    ]

    const reportData = {
      totalItems: totalConsumed,
      totalCost: periodTotalCost,
      lowStockAlerts: lowStockAlerts.length,
      topConsumingDepartments: topDepartments.map(dept => ({
        department: dept.department,
        totalConsumed: dept.consumed,
        totalCost: dept.cost
      })),
      mostConsumedItems: topItems.map(item => ({
        itemName: item.name,
        totalConsumed: item.consumed,
        totalCost: item.cost,
        unit: item.unit
      })),
      costByCategory: costByCategory.map(cat => ({
        category: cat.category,
        totalCost: cat.cost,
        itemCount: cat.itemCount
      })),
      costByDepartment: costByDepartment.map(dept => ({
        department: dept.department,
        totalCost: dept.cost,
        orderCount: dept.orderCount
      })),
      predictedDemand: predictedDemand.map(pred => ({
        itemName: pred.item,
        currentStock: pred.currentStock,
        predictedDemand: pred.predicted,
        recommendedOrder: Math.max(0, pred.predicted - pred.currentStock),
        unit: pred.unit
      })),
      lowStockItems: lowStockAlerts.map(alert => ({
        itemName: alert.item,
        currentStock: alert.currentStock,
        minimumStock: alert.minimumStock,
        unit: alert.unit,
        category: alert.category
      }))
    }

    return NextResponse.json(reportData)
  } catch (error) {
    console.error('Error fetching quick reports data:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quick reports data' },
      { status: 500 }
    )
  }
}