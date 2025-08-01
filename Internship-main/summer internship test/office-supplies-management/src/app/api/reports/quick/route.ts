import { NextResponse } from 'next/server'
import { db as prisma } from '@/lib/db'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get current date for time-based queries
    const now = new Date()
    const currentMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const currentYear = new Date(now.getFullYear(), 0, 1)

    // Consumption Report Data
    const totalItems = await prisma.item.count()
    
    // Get approved requests from current month
    const approvedRequests = await prisma.request.findMany({
      where: {
        status: 'APPROVED',
        createdAt: {
          gte: currentMonth
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
        user: {
          select: {
            department: true
          }
        }
      }
    })

    const totalConsumed = approvedRequests.reduce((sum, request) => {
      return sum + request.items.reduce((itemSum, requestItem) => itemSum + requestItem.quantity, 0)
    }, 0)

    // Top departments by consumption
    const departmentConsumption = approvedRequests.reduce((acc, request) => {
      const dept = request.user?.department || 'Unknown'
      const requestTotal = request.items.reduce((sum, item) => sum + item.quantity, 0)
      acc[dept] = (acc[dept] || 0) + requestTotal
      return acc
    }, {} as Record<string, number>)

    const topDepartments = Object.entries(departmentConsumption)
      .map(([department, consumed]) => ({ department, consumed }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5)

    // Top items by consumption
    const itemConsumption = approvedRequests.reduce((acc, request) => {
      request.items.forEach(requestItem => {
        const itemName = requestItem.item.name
        const category = requestItem.item.category?.name || 'Uncategorized'
        acc[itemName] = {
          consumed: (acc[itemName]?.consumed || 0) + requestItem.quantity,
          category
        }
      })
      return acc
    }, {} as Record<string, { consumed: number; category: string }>)

    const topItems = Object.entries(itemConsumption)
      .map(([name, data]) => ({ name, consumed: data.consumed, category: data.category }))
      .sort((a, b) => b.consumed - a.consumed)
      .slice(0, 5)

    // Cost Analysis Data
    const requests = await prisma.request.findMany({
      where: {
        status: {
          in: ['APPROVED', 'COMPLETED']
        },
        createdAt: {
          gte: currentYear
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
        user: {
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

    // Cost by category
    const categorySpend = requests.reduce((acc, request) => {
      request.items.forEach(requestItem => {
        const category = requestItem.item.category?.name || 'Uncategorized'
        const itemCost = requestItem.totalPrice || (requestItem.quantity * requestItem.item.price)
        acc[category] = (acc[category] || 0) + itemCost
      })
      return acc
    }, {} as Record<string, number>)

    const costByCategory = Object.entries(categorySpend)
      .map(([category, cost]) => ({ category, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)

    // Cost by department
    const departmentSpend = requests.reduce((acc, request) => {
      const dept = request.user?.department || 'Unknown'
      const requestCost = request.items.reduce((sum, item) => {
        return sum + (item.totalPrice || (item.quantity * item.item.price))
      }, 0)
      acc[dept] = (acc[dept] || 0) + requestCost
      return acc
    }, {} as Record<string, number>)

    const costByDepartment = Object.entries(departmentSpend)
      .map(([department, cost]) => ({ department, cost }))
      .sort((a, b) => b.cost - a.cost)
      .slice(0, 5)

    // Forecast Report Data
    // Get all items with their stock levels
    const itemsWithStock = await prisma.item.findMany({
      select: {
        id: true,
        name: true,
        currentStock: true,
        category: {
          select: {
            name: true
          }
        }
      }
    })

    // Calculate predicted demand based on historical consumption
    const predictedDemand = itemConsumption
      ? Object.entries(itemConsumption)
          .map(([name, data]) => ({
            item: name,
            predicted: Math.round(data.consumed * 1.2), // 20% increase prediction
            category: data.category
          }))
          .sort((a, b) => b.predicted - a.predicted)
          .slice(0, 10)
      : []

    // Low stock alerts (items with stock below 10)
    const lowStockAlerts = itemsWithStock
      .filter(item => item.currentStock <= 10)
      .map(item => ({
        item: item.name,
        currentStock: item.currentStock,
        minimumStock: 10, // Default minimum
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
      consumptionReport: {
        totalItems,
        totalConsumed,
        topDepartments,
        topItems
      },
      costAnalysis: {
        totalCost,
        monthlySpend,
        costByCategory,
        costByDepartment
      },
      forecastReport: {
        predictedDemand,
        lowStockAlerts,
        seasonalTrends
      }
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