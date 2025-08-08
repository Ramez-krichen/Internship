import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function generateHistoricalData() {
  console.log('🕒 Generating historical data...')

  try {
    // Get existing users, items, and categories
    const users = await prisma.user.findMany()
    const items = await prisma.item.findMany({ include: { category: true } })
    const categories = await prisma.category.findMany()

    if (users.length === 0 || items.length === 0) {
      console.log('❌ No users or items found. Please run the seed script first.')
      return
    }

    // Generate data for the past 12 months
    const now = new Date()
    const departments = ['IT', 'HR', 'Finance', 'Operations', 'Marketing', 'Sales']
    
    for (let monthsBack = 1; monthsBack <= 12; monthsBack++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1)
      const monthEnd = new Date(now.getFullYear(), now.getMonth() - monthsBack + 1, 0)
      
      console.log(`📅 Generating data for ${monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}...`)
      
      // Generate 10-30 requests per month
      const requestsCount = Math.floor(Math.random() * 20) + 10
      
      for (let i = 0; i < requestsCount; i++) {
        const randomUser = users[Math.floor(Math.random() * users.length)]
        const requestDate = new Date(
          monthDate.getTime() + Math.random() * (monthEnd.getTime() - monthDate.getTime())
        )
        
        // Create request
        const request = await prisma.request.create({
          data: {
            title: `Monthly Supply Request ${i + 1}`,
            description: `Routine office supplies request for ${departments[Math.floor(Math.random() * departments.length)]} department`,
            priority: ['LOW', 'MEDIUM', 'HIGH'][Math.floor(Math.random() * 3)] as any,
            status: 'APPROVED', // All historical requests are approved
            requesterId: randomUser.id,
            department: departments[Math.floor(Math.random() * departments.length)],
            totalAmount: 0, // Will be calculated after adding items
            createdAt: requestDate,
            updatedAt: requestDate
          }
        })
        
        // Add 1-5 unique items to each request
        const itemsCount = Math.floor(Math.random() * 5) + 1
        let totalAmount = 0
        const usedItems = new Set()
        
        for (let j = 0; j < itemsCount; j++) {
          let randomItem
          let attempts = 0
          
          // Find an item that hasn't been used in this request
          do {
            randomItem = items[Math.floor(Math.random() * items.length)]
            attempts++
          } while (usedItems.has(randomItem.id) && attempts < 10)
          
          // If we couldn't find a unique item after 10 attempts, skip
          if (usedItems.has(randomItem.id)) continue
          
          usedItems.add(randomItem.id)
          const quantity = Math.floor(Math.random() * 10) + 1
          const itemTotal = randomItem.price * quantity
          totalAmount += itemTotal
          
          await prisma.requestItem.create({
            data: {
              requestId: request.id,
              itemId: randomItem.id,
              quantity,
              unitPrice: randomItem.price,
              totalPrice: itemTotal,
              notes: `Requested for ${departments[Math.floor(Math.random() * departments.length)]} department`
            }
          })
          
          // Create corresponding stock movement
          await prisma.stockMovement.create({
            data: {
              itemId: randomItem.id,
              type: 'OUT',
              quantity,
              reason: `Request fulfillment - ${request.title}`,
              userId: randomUser.id,
              createdAt: requestDate
            }
          })
        }
        
        // Update request total amount
        await prisma.request.update({
          where: { id: request.id },
          data: { totalAmount }
        })
        
        // Create audit log
        await prisma.auditLog.create({
          data: {
            action: 'CREATE',
            entity: 'Request',
            entityId: request.id,
            performedBy: randomUser.id,
            details: `Historical request created: ${request.title}`,
            timestamp: requestDate
          }
        })
      }
      
      // Generate some stock replenishments for the month
      const replenishmentsCount = Math.floor(Math.random() * 5) + 2
      
      for (let i = 0; i < replenishmentsCount; i++) {
        const randomItem = items[Math.floor(Math.random() * items.length)]
        const randomUser = users.find(u => u.role === 'ADMIN') || users[0]
        const replenishDate = new Date(
          monthDate.getTime() + Math.random() * (monthEnd.getTime() - monthDate.getTime())
        )
        const quantity = Math.floor(Math.random() * 100) + 50
        
        await prisma.stockMovement.create({
          data: {
            itemId: randomItem.id,
            type: 'IN',
            quantity,
            reason: 'Stock replenishment',
            userId: randomUser.id,
            createdAt: replenishDate
          }
        })
        
        // Update item stock
        await prisma.item.update({
          where: { id: randomItem.id },
          data: {
            currentStock: {
              increment: quantity
            }
          }
        })
      }
    }
    
    console.log('✅ Historical data generated successfully!')
    console.log('📊 Generated:')
    console.log('   - 12 months of request data')
    console.log('   - Stock movements and replenishments')
    console.log('   - Audit logs for all activities')
    
  } catch (error) {
    console.error('❌ Error generating historical data:', error)
  } finally {
    await prisma.$disconnect()
  }
}

generateHistoricalData()