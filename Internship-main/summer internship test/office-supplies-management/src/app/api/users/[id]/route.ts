import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { db as prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, email, password, role, department, status } = body
    const { id } = params

    const updateData: any = {
      name,
      email,
      role,
      department,
      status,
    }

    if (password) {
      updateData.password = await bcrypt.hash(password, 10)
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error(`Error updating user ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to update user' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    const deletedUser = await prisma.user.delete({
      where: { id },
    })

    // Create audit log entry for user deletion
    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'User',
        entityId: id,
        performedBy: session.user.id,
        details: `Deleted user: ${deletedUser.email || deletedUser.name || id}`,
      },
    })

    return NextResponse.json({ message: 'User deleted successfully' })
  } catch (error) {
    console.error(`Error deleting user ${params.id}:`, error)
    return NextResponse.json(
      { error: 'Failed to delete user' },
      { status: 500 }
    )
  }
}