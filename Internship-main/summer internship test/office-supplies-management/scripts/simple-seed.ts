import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Simple seeding database...')

  // Create admin user
  const adminPassword = await bcrypt.hash('admin123', 12)
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@example.com',
      name: 'John Admin',
      password: adminPassword,
      role: 'ADMIN',
      department: 'IT',
    },
  })

  // Create manager user
  const managerPassword = await bcrypt.hash('manager123', 12)
  const managerUser = await prisma.user.create({
    data: {
      email: 'manager@example.com',
      name: 'Mike Manager',
      password: managerPassword,
      role: 'MANAGER',
      department: 'Operations',
    },
  })

  // Create employee user
  const employeePassword = await bcrypt.hash('employee123', 12)
  const employeeUser = await prisma.user.create({
    data: {
      email: 'employee@example.com',
      name: 'Jane Employee',
      password: employeePassword,
      role: 'EMPLOYEE',
      department: 'Sales',
    },
  })

  // Create suppliers
  const supplier1 = await prisma.supplier.create({
    data: {
      name: 'Office Depot',
      email: 'contact@officedepot.com',
      phone: '+1-555-0101',
      address: '123 Business St, City, State 12345',
      contactPerson: 'John Smith',
    },
  })

  const supplier2 = await prisma.supplier.create({
    data: {
      name: 'Staples Inc',
      email: 'orders@staples.com',
      phone: '+1-555-0102',
      address: '456 Commerce Ave, City, State 12346',
      contactPerson: 'Sarah Johnson',
    },
  })

  // Create categories
  const category1 = await prisma.category.create({
    data: {
      name: 'Office Supplies',
      description: 'General office supplies and stationery',
    },
  })

  const category2 = await prisma.category.create({
    data: {
      name: 'Technology',
      description: 'Computer and technology equipment',
    },
  })

  // Create items
  const item1 = await prisma.item.create({
    data: {
      name: 'Ballpoint Pens',
      description: 'Blue ink ballpoint pens, pack of 10',
      sku: 'PEN-001',
      currentStock: 50,
      minStock: 10,
      maxStock: 100,
      unitPrice: 5.99,
      categoryId: category1.id,
      supplierId: supplier1.id,
    },
  })

  const item2 = await prisma.item.create({
    data: {
      name: 'Wireless Mouse',
      description: 'Ergonomic wireless optical mouse',
      sku: 'MOUSE-001',
      currentStock: 25,
      minStock: 5,
      maxStock: 50,
      unitPrice: 29.99,
      categoryId: category2.id,
      supplierId: supplier2.id,
    },
  })

  console.log('✅ Simple seeding completed!')
  console.log('Created:')
  console.log('- 3 users (admin, manager, employee)')
  console.log('- 2 suppliers')
  console.log('- 2 categories')
  console.log('- 2 items')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })