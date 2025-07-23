'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useEffect, useState } from 'react'
import { Plus, Search, Filter, ShoppingCart, Calendar, DollarSign, Truck, Edit, Trash2, Eye, Download, Send, CheckCircle } from 'lucide-react'
import { OrderModal } from '@/components/modals/OrderModal'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ExportButton } from '@/components/ui/export'
import { DateRange } from '@/components/ui/form'

interface OrderItem {
  id?: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice?: number
}

interface Order {
  id: string
  orderNumber: string
  supplier: string
  supplierId?: string
  status: 'DRAFT' | 'SENT' | 'CONFIRMED' | 'PARTIALLY_RECEIVED' | 'RECEIVED' | 'CANCELLED'
  totalAmount: number
  orderDate: string
  expectedDate?: string
  receivedDate?: string
  itemsCount: number
  items: OrderItem[]
  notes?: string
  priority?: 'Low' | 'Medium' | 'High' | 'Urgent'
  department?: string
  requestedBy?: string
  approvedBy?: string
  createdAt?: string
  updatedAt?: string
}





const statusColors = {
  DRAFT: 'bg-gray-100 text-gray-800',
  SENT: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-yellow-100 text-yellow-800',
  PARTIALLY_RECEIVED: 'bg-orange-100 text-orange-800',
  RECEIVED: 'bg-green-100 text-green-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

const priorityColors = {
  Low: 'bg-green-100 text-green-800',
  Medium: 'bg-yellow-100 text-yellow-800',
  High: 'bg-orange-100 text-orange-800',
  Urgent: 'bg-red-100 text-red-800'
}

export default function OrdersPage() {
    const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [supplierFilter, setSupplierFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingOrder, setEditingOrder] = useState<Order | null>(null)
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null)
  const [orderToDelete, setOrderToDelete] = useState<Order | null>(null)
  const [orderToSend, setOrderToSend] = useState<Order | null>(null)
  const [orderToReceive, setOrderToReceive] = useState<Order | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isSending, setIsSending] = useState(false)
  const [isReceiving, setIsReceiving] = useState(false)
  
  // Get unique values for filters
  const suppliers = Array.from(new Set(orders.map(order => order.supplier)))
  const departments = Array.from(new Set(orders.map(order => order.department).filter(Boolean)))

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true)
        const response = await fetch('/api/orders')
        
        if (response.ok) {
          const ordersData = await response.json()
          setOrders(ordersData.orders || [])
        }
      } catch (error) {
        console.error('Error fetching orders:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [])
  
  const handleAddOrder = async (orderData: Partial<Order>) => {
    setIsLoading(true)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })
      
      if (response.ok) {
        const newOrder = await response.json()
        setOrders(prev => [...prev, newOrder])
        setIsAddModalOpen(false)
      } else {
        console.error('Failed to add order')
      }
    } catch (error) {
      console.error('Error adding order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  
  const handleEditOrder = async (orderData: Partial<Order>) => {
    if (!editingOrder) return

    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders/${editingOrder.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      })
      
      if (response.ok) {
        const updatedOrder = await response.json()
        setOrders(prev => prev.map(order => order.id === editingOrder.id ? updatedOrder : order))
        setEditingOrder(null)
      } else {
        console.error('Failed to update order')
      }
    } catch (error) {
      console.error('Error updating order:', error)
    } finally {
      setIsLoading(false)
    }
  }


  const handleViewOrder = (order: Order) => {
    setViewingOrder(order)
    setIsReadOnly(true)
    setIsAddModalOpen(true)
  }
  
  const handleDeleteOrder = async () => {
    if (!orderToDelete) return

    setIsDeleting(true)
    try {
      const response = await fetch(`/api/orders/${orderToDelete.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        setOrders(prev => prev.filter(order => order.id !== orderToDelete.id))
        setOrderToDelete(null)
      } else {
        console.error('Failed to delete order')
      }
    } catch (error) {
      console.error('Error deleting order:', error)
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleSendOrder = async () => {
    if (!orderToSend) return

    setIsSending(true)
    try {
      const response = await fetch(`/api/orders/${orderToSend.id}/send`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const updatedOrder = await response.json()
        setOrders(prev => prev.map(order => order.id === orderToSend.id ? updatedOrder : order))
        setOrderToSend(null)
      } else {
        console.error('Failed to send order')
      }
    } catch (error) {
      console.error('Error sending order:', error)
    } finally {
      setIsSending(false)
    }
  }
  
  const handleReceiveOrder = async () => {
    if (!orderToReceive) return

    setIsReceiving(true)
    try {
      const response = await fetch(`/api/orders/${orderToReceive.id}/receive`, {
        method: 'POST',
      })
      
      if (response.ok) {
        const updatedOrder = await response.json()
        setOrders(prev => prev.map(order => order.id === orderToReceive.id ? updatedOrder : order))
        setOrderToReceive(null)
      } else {
        console.error('Failed to receive order')
      }
    } catch (error) {
      console.error('Error receiving order:', error)
    } finally {
      setIsReceiving(false)
    }
  }
  
  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.supplier.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (order.requestedBy && order.requestedBy.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === 'ALL' || order.status === statusFilter
    const matchesSupplier = supplierFilter === 'ALL' || order.supplier === supplierFilter
    const matchesPriority = priorityFilter === 'ALL' || order.priority === priorityFilter
    const matchesDepartment = departmentFilter === 'ALL' || order.department === departmentFilter
    
    let matchesDateRange = true
    if (dateRange.start && dateRange.end) {
      const orderDate = new Date(order.orderDate)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      matchesDateRange = orderDate >= startDate && orderDate <= endDate
    }
    
    return matchesSearch && matchesStatus && matchesSupplier && matchesPriority && matchesDepartment && matchesDateRange
  })
  
  const exportData = filteredOrders.map(order => ({
    'Order Number': order.orderNumber,
    Supplier: order.supplier,
    Status: order.status,
    Priority: order.priority || '',
    Department: order.department || '',
    'Requested By': order.requestedBy || '',
    'Approved By': order.approvedBy || '',
    'Order Date': order.orderDate,
    'Expected Date': order.expectedDate || '',
    'Received Date': order.receivedDate || '',
    'Total Amount': order.totalAmount,
    'Items Count': order.itemsCount,
    Notes: order.notes || ''
  }))

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'DRAFT': return <Calendar className="h-4 w-4" />
      case 'SENT': return <Send className="h-4 w-4" />
      case 'CONFIRMED': return <CheckCircle className="h-4 w-4" />
      case 'PARTIALLY_RECEIVED': return <Truck className="h-4 w-4" />
      case 'RECEIVED': return <Truck className="h-4 w-4" />
      case 'CANCELLED': return <Calendar className="h-4 w-4" />
      default: return <ShoppingCart className="h-4 w-4" />
    }
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Purchase Orders</h1>
            <p className="text-gray-600">Manage supplier orders and deliveries</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={exportData}
              filename="purchase-orders"
              variant="primary"
            >
              <Download className="h-4 w-4" />
              Export
            </ExportButton>
            <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2 w-fit"
          >
            <Plus className="h-4 w-4" />
            New Order
          </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex gap-4 items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search orders by number, supplier, or requester..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="DRAFT">Draft</option>
                  <option value="SENT">Sent</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="PARTIALLY_RECEIVED">Partially Received</option>
                  <option value="RECEIVED">Received</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Supplier</label>
                <select
                  value={supplierFilter}
                  onChange={(e) => setSupplierFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Suppliers</option>
                  {suppliers.map(supplier => (
                    <option key={supplier} value={supplier}>{supplier}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(department => (
                    <option key={department} value={department}>{department}</option>
                  ))}
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Order Date Range</label>
                <DateRange
                  value={dateRange}
                  onChange={setDateRange}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Orders Grid */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Purchase Orders ({filteredOrders.length})
            </h3>
          </div>
          
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 p-6">
            {filteredOrders.map((order) => (
              <div key={order.id} className="bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <div className="ml-3">
                        <h3 className="text-lg font-medium text-gray-900">{order.orderNumber}</h3>
                        <p className="text-sm text-gray-500">{order.supplier}</p>
                        {order.department && (
                          <p className="text-xs text-gray-400">{order.department}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[order.status]}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                      {order.priority && (
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[order.priority]}`}>
                          {order.priority}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Order Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {new Date(order.orderDate).toLocaleDateString()}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Expected Date</div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.expectedDate ? new Date(order.expectedDate).toLocaleDateString() : 'TBD'}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Amount</div>
                      <div className="text-lg font-semibold text-gray-900">
                        ${order.totalAmount.toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Items</div>
                      <div className="text-sm font-medium text-gray-900">
                        {order.itemsCount} item(s)
                      </div>
                    </div>
                  </div>

                  {order.requestedBy && (
                    <div className="mb-4">
                      <div className="text-sm text-gray-500">Requested by</div>
                      <div className="text-sm font-medium text-gray-900">{order.requestedBy}</div>
                    </div>
                  )}

                  {order.receivedDate && (
                    <div className="mb-4 p-3 bg-green-50 rounded-md">
                      <div className="text-sm text-green-800">
                        <strong>Received:</strong> {new Date(order.receivedDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}

                  <div className="pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => setViewingOrder(order)}
                          className="text-gray-600 hover:text-gray-900 p-1 rounded transition-colors hover:bg-gray-50"
                          title="View order details"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        {order.status === 'DRAFT' && (
                          <button 
                            onClick={() => setEditingOrder(order)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 rounded transition-colors hover:bg-indigo-50"
                            title="Edit order"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        )}
                        <button 
                          onClick={() => setOrderToDelete(order)}
                          className="text-red-600 hover:text-red-900 p-1 rounded transition-colors hover:bg-red-50"
                          title="Delete order"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex space-x-2">
                        {order.status === 'DRAFT' && (
                          <button 
                            onClick={() => setOrderToSend(order)}
                            className="bg-indigo-600 text-white px-3 py-1 rounded text-sm hover:bg-indigo-700 transition-colors flex items-center gap-1"
                            title="Send order to supplier"
                          >
                            <Send className="h-3 w-3" />
                            Send
                          </button>
                        )}
                        {(order.status === 'SENT' || order.status === 'CONFIRMED') && (
                          <button 
                            onClick={() => setOrderToReceive(order)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700 transition-colors flex items-center gap-1"
                            title="Mark order as received"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Received
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12">
              <ShoppingCart className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No orders found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || supplierFilter !== 'ALL' || priorityFilter !== 'ALL' || departmentFilter !== 'ALL' || dateRange.start || dateRange.end
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new purchase order.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Order Modal */}
      <OrderModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingOrder(null)
          setViewingOrder(null)
          setIsReadOnly(false)
        }}
        onSave={editingOrder ? handleEditOrder : handleAddOrder}
        order={editingOrder || viewingOrder}
        mode={editingOrder ? 'edit' : (viewingOrder ? 'view' : 'add')}
        readOnly={isReadOnly}
      />

      {/* Edit Order Modal */}
      <OrderModal
        isOpen={!!editingOrder}
        onClose={() => setEditingOrder(null)}
        onSave={handleEditOrder}
        mode="edit"
        title="Edit Order"
        initialData={editingOrder || undefined}
      />

      {/* View Order Modal */}
      <OrderModal
        isOpen={!!viewingOrder}
        onClose={() => setViewingOrder(null)}
        mode="view"
        title="Order Details"
        initialData={viewingOrder || undefined}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        onConfirm={() => handleDeleteOrder(orderToDelete?.id || '')}
        type="delete"
        entityType="Order"
        entityName={orderToDelete?.orderNumber || ''}
        isLoading={isDeleting}
      />

      {/* Send Order Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!orderToSend}
        onClose={() => setOrderToSend(null)}
        onConfirm={() => handleSendOrder(orderToSend?.id || '')}
        type="send"
        entityType="Order"
        entityName={orderToSend?.orderNumber || ''}
        isLoading={isSending}
        customMessage={`Are you sure you want to send order "${orderToSend?.orderNumber}" to ${orderToSend?.supplier}?`}
      />

      {/* Mark Received Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!orderToReceive}
        onClose={() => setOrderToReceive(null)}
        onConfirm={handleReceiveOrder}
        type="receive"
        entityType="Order"
        entityName={orderToReceive?.orderNumber || ''}
        isLoading={isReceiving}
        customMessage={`Are you sure you want to mark order "${orderToReceive?.orderNumber}" as received?`}
      />
    </DashboardLayout>
  )
}
