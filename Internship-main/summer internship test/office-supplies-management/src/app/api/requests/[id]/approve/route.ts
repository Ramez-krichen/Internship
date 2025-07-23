import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only managers and admins can approve requests
    if (session.user.role !== 'ADMIN' && session.user.role !== 'MANAGER') {
      return NextResponse.json(
        { error: 'Only managers and admins can approve requests' },
        { status: 403 }
      )
    }

    const requestId = params.id
    const body = await request.json()
    const { status, comments } = body

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status. Must be APPROVED or REJECTED' },
        { status: 400 }
      )
    }

    // If rejecting, comments are required
    if (status === 'REJECTED' && !comments) {
      return NextResponse.json(
        { error: 'Comments are required when rejecting a request' },
        { status: 400 }
      )
    }

    // Check if request exists
    const existingRequest = await db.request.findUnique({
      where: { id: requestId },
      include: {
        approvals: {
          orderBy: {
            level: 'asc'
          }
        }
      }
    })

    if (!existingRequest) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 })
    }

    // Check if request is already approved or rejected
    if (existingRequest.status === 'APPROVED' || existingRequest.status === 'REJECTED') {
      return NextResponse.json(
        { error: `Request is already ${existingRequest.status.toLowerCase()}` },
        { status: 400 }
      )
    }

    // Find the current approval level for this request
    const currentApproval = existingRequest.approvals.find(
      approval => approval.status === 'PENDING' && approval.approverId === session.user.id
    )

    if (!currentApproval) {
      return NextResponse.json(
        { error: 'You are not assigned to approve this request' },
        { status: 403 }
      )
    }

    // Update the approval
    await db.approval.update({
      where: { id: currentApproval.id },
      data: {
        status,
        comments: comments || null,
        updatedAt: new Date()
      }
    })

    // Update the request status if this is the final approval or if rejected
    if (status === 'REJECTED') {
      await db.request.update({
        where: { id: requestId },
        data: {
          status: 'REJECTED',
          updatedAt: new Date()
        }
      })
    } else {
      // Check if this was the final approval needed
      const isLastApproval = existingRequest.approvals.every(
        approval => approval.id === currentApproval.id || approval.status !== 'PENDING'
      )

      if (isLastApproval) {
        await db.request.update({
          where: { id: requestId },
          data: {
            status: 'APPROVED',
            updatedAt: new Date()
          }
        })
      }
    }

    // Create audit log
    await db.auditLog.create({
      data: {
        action: status === 'APPROVED' ? 'APPROVE' : 'REJECT',
        entity: 'Request',
        entityId: requestId,
        performedBy: session.user.id,
        details: `${status === 'APPROVED' ? 'Approved' : 'Rejected'} request: ${existingRequest.title}${comments ? ` - Comments: ${comments}` : ''}`
      }
    })

    return NextResponse.json({
      success: true,
      message: `Request ${status.toLowerCase()} successfully`
    })
  } catch (error) {
    console.error('Error approving/rejecting request:', error)
    return NextResponse.json(
      { error: 'Failed to process approval' },
      { status: 500 }
    )
  }
}