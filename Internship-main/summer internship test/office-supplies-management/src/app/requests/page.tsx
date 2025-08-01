'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { useState, useEffect } from 'react'
import { Plus, Search, Filter, Eye, Edit, Download, Calendar, FileText, Trash2 } from 'lucide-react'
import { RequestModal } from '@/components/modals/RequestModal'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ExportButton } from '@/components/ui/export'
import { DateRange } from '@/components/ui/form'
import { useSession } from 'next-auth/react'
import { toast } from 'react-hot-toast'

interface RequestItem {
  id?: string
  name: string
  quantity: number
  unitPrice: number
  description?: string
  category?: string
}

interface Request {
  id: string
  title: string
  description: string
  requester: string
  requesterId?: string
  department: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS' | 'COMPLETED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  totalAmount: number
  createdAt: string
  updatedAt?: string
  approvedBy?: string
  approvedAt?: string
  rejectedReason?: string
  items: RequestItem[]
  notes?: string
  expectedDelivery?: string
}

const mockRequests: Request[] = [
  {
    id: '1',
    title: 'Office Supplies for Marketing Team',
    description: 'Monthly office supplies order for marketing department',
    requester: 'John Doe',
    requesterId: 'user-1',
    department: 'Marketing',
    status: 'PENDING',
    priority: 'MEDIUM',
    totalAmount: 245.50,
    createdAt: '2024-01-15',
    expectedDelivery: '2024-01-25',
    items: [
      { id: '1', name: 'Blue Ballpoint Pens (Pack of 10)', quantity: 5, unitPrice: 12.99, category: 'Writing Supplies' },
      { id: '2', name: 'A4 Copy Paper (500 sheets)', quantity: 10, unitPrice: 8.50, category: 'Paper Products' },
    ],
    notes: 'Urgent need for marketing campaign materials'
  },
  {
    id: '2',
    title: 'Printer Maintenance Supplies',
    description: 'Toner and paper for office printers',
    requester: 'Jane Smith',
    requesterId: 'user-2',
    department: 'IT',
    status: 'APPROVED',
    priority: 'HIGH',
    totalAmount: 189.99,
    createdAt: '2024-01-14',
    approvedBy: 'Admin User',
    approvedAt: '2024-01-15',
    expectedDelivery: '2024-01-20',
    items: [
      { id: '3', name: 'Laser Printer Toner Cartridge', quantity: 2, unitPrice: 89.99, category: 'Printer Supplies' },
    ]
  },
  {
    id: '3',
    title: 'Cleaning Supplies',
    description: 'Weekly cleaning supplies for office maintenance',
    requester: 'Mike Johnson',
    requesterId: 'user-3',
    department: 'Facilities',
    status: 'IN_PROGRESS',
    priority: 'LOW',
    totalAmount: 156.75,
    createdAt: '2024-01-13',
    updatedAt: '2024-01-16',
    expectedDelivery: '2024-01-22',
    items: [
      { id: '4', name: 'All-Purpose Cleaner', quantity: 12, unitPrice: 6.75, category: 'Cleaning Supplies' },
      { id: '5', name: 'Paper Towels', quantity: 8, unitPrice: 4.50, category: 'Cleaning Supplies' },
    ]
  },
  {
    id: '4',
    title: 'Conference Room Setup',
    description: 'Equipment and supplies for new conference room',
    requester: 'Sarah Wilson',
    requesterId: 'user-4',
    department: 'Operations',
    status: 'REJECTED',
    priority: 'MEDIUM',
    totalAmount: 1250.00,
    createdAt: '2024-01-12',
    rejectedReason: 'Budget constraints for Q1',
    items: [
      { id: '6', name: 'Whiteboard Markers (Set of 12)', quantity: 3, unitPrice: 25.00, category: 'Office Supplies' },
      { id: '7', name: 'Flip Chart Paper', quantity: 5, unitPrice: 45.00, category: 'Office Supplies' },
    ]
  }
]

const statusColors = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  APPROVED: 'bg-green-100 text-green-800',
  REJECTED: 'bg-red-100 text-red-800',
  IN_PROGRESS: 'bg-blue-100 text-blue-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
}

const priorityColors = {
  LOW: 'bg-gray-100 text-gray-800',
  MEDIUM: 'bg-yellow-100 text-yellow-800',
  HIGH: 'bg-orange-100 text-orange-800',
  URGENT: 'bg-red-100 text-red-800',
}

export default function RequestsPage() {
  const { data: session } = useSession()
  const [requests, setRequests] = useState<Request[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [priorityFilter, setPriorityFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [isNewRequestModalOpen, setIsNewRequestModalOpen] = useState(false)
  const [editingRequest, setEditingRequest] = useState<Request | null>(null)
  const [viewingRequest, setViewingRequest] = useState<Request | null>(null)
  const [requestToDelete, setRequestToDelete] = useState<Request | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // Get unique departments for filter
  const departments = Array.from(new Set(requests.map(request => request.department)))

  // Fetch requests from API
  useEffect(() => {
    const fetchRequests = async () => {
      setIsLoading(true)
      try {
        const response = await fetch('/api/requests')
        if (response.ok) {
          const data = await response.json()
          setRequests(data.requests)
        } else {
          toast.error('Failed to fetch requests')
        }
      } catch (error) {
        console.error('Error fetching requests:', error)
        toast.error('An error occurred while fetching requests')
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchRequests()
  }, []);
  
  const handleAddRequest = async (requestData: Partial<Request>) => {
    try {
      // The API call is now handled in the RequestModal component
      // This function is called after successful creation
      const response = await fetch('/api/requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        toast.success('Request created successfully')
      }
      setIsNewRequestModalOpen(false)
    } catch (error) {
      console.error('Error refreshing requests:', error)
      toast.error('Failed to refresh requests')
    }
  }
  
  const handleEditRequest = async (requestData: Partial<Request>) => {
    if (!editingRequest) return
    
    try {
      // The API call is now handled in the RequestModal component
      // This function is called after successful update
      const response = await fetch('/api/requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        toast.success('Request updated successfully')
      }
      setEditingRequest(null)
      setIsNewRequestModalOpen(false)
    } catch (error) {
      console.error('Error refreshing requests:', error)
      toast.error('Failed to update request')
    }
  }

  const handleViewRequest = (request: Request) => {
    setViewingRequest(request)
    setIsReadOnly(true)
  }

  const handleEditRequestClick = (request: Request) => {
    setEditingRequest(request)
    setIsReadOnly(false)
  }
  
  const handleDeleteRequest = async () => {
    if (!requestToDelete) return
    
    setIsDeleting(true)
    try {
      const response = await fetch(`/api/requests/${requestToDelete.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to delete request')
      }

      toast.success('Request deleted successfully')
      
      // Refresh the requests list
      const updatedResponse = await fetch('/api/requests')
      if (updatedResponse.ok) {
        const data = await updatedResponse.json()
        setRequests(data.requests)
      }
      
      setRequestToDelete(null)
    } catch (error) {
      console.error('Error deleting request:', error)
      toast.error(error instanceof Error ? error.message : 'An error occurred while deleting the request')
    } finally {
      setIsDeleting(false)
    }
  }
  
  const handleUpdateStatus = async (requestId: string, newStatus: Request['status'], reason?: string) => {
    try {
      // The API call is now handled in the ViewRequestModal component
      // This function is called after successful status update
      const response = await fetch('/api/requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests)
        toast.success(`Request status updated to ${newStatus.toLowerCase()}`)
      }
      setViewingRequest(null)
    } catch (error) {
      console.error('Error refreshing requests:', error)
      toast.error('Failed to update request status')
    }
  }
  
  const filteredRequests = requests.filter(request => {
    const matchesSearch = request.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.requester.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         request.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'ALL' || request.status === statusFilter
    const matchesPriority = priorityFilter === 'ALL' || request.priority === priorityFilter
    const matchesDepartment = departmentFilter === 'ALL' || request.department === departmentFilter
    
    let matchesDate = true
    if (dateRange.start && dateRange.end) {
      const requestDate = new Date(request.createdAt)
      const startDate = new Date(dateRange.start)
      const endDate = new Date(dateRange.end)
      matchesDate = requestDate >= startDate && requestDate <= endDate
    }
    
    return matchesSearch && matchesStatus && matchesPriority && matchesDepartment && matchesDate
  })
  
  const exportData = filteredRequests.map(request => ({
    ID: request.id,
    Title: request.title,
    Description: request.description,
    Requester: request.requester,
    Department: request.department,
    Status: request.status,
    Priority: request.priority,
    'Total Amount': `$${request.totalAmount.toFixed(2)}`,
    'Created Date': request.createdAt,
    'Expected Delivery': request.expectedDelivery || '',
    'Items Count': request.items.length,
    Notes: request.notes || ''
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Requests</h1>
            <p className="text-gray-600">Manage supply requests and approvals</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-2">
            <ExportButton 
              data={exportData}
              filename="requests"
              variant="default"
              className="w-full sm:w-auto justify-center"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline ml-2">Export</span>
            </ExportButton>
            <button
              onClick={() => setIsNewRequestModalOpen(true)}
              className="bg-blue-600 text-white px-3 py-2 rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
            >
              <Plus className="h-4 w-4" />
              New Request
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white p-4 rounded-lg shadow space-y-4">
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <input
                type="text"
                placeholder="Search requests..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-md w-full focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors whitespace-nowrap"
            >
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Filters</span>
            </button>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="COMPLETED">Completed</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Priorities</option>
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  value={departmentFilter}
                  onChange={(e) => setDepartmentFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Departments</option>
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
                <DateRange
                  startDate={dateRange.start}
                  endDate={dateRange.end}
                  onStartDateChange={(date) => setDateRange(prev => ({ ...prev, start: date }))}
                  onEndDateChange={(date) => setDateRange(prev => ({ ...prev, end: date }))}
                  className="w-full"
                />
              </div>
            </div>
          )}
        </div>

        {/* Requests Table/Cards */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Requests ({filteredRequests.length})
            </h3>
          </div>
          
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Requester
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      Loading requests...
                    </td>
                  </tr>
                ) : filteredRequests.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-4 text-gray-500">
                      No requests found
                    </td>
                  </tr>
                ) : filteredRequests.map((request) => (
                  <tr key={request.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.title}</div>
                        <div className="text-sm text-gray-500">{request.description}</div>
                        <div className="text-xs text-gray-400 mt-1">
                          {request.items.length} item{request.items.length !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{request.requester}</div>
                        <div className="text-sm text-gray-500">{request.department}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[request.status]}`}>
                        {request.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[request.priority]}`}>
                        {request.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      ${request.totalAmount.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <div>{request.createdAt}</div>
                      {request.expectedDelivery && (
                        <div className="text-xs text-gray-400">
                          Expected: {request.expectedDelivery}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleViewRequest(request)}
                          className="text-blue-600 hover:text-blue-900"
                          title="View Request"
                        >
                          <Eye className="h-5 w-5" />
                        </button>
                        {(session?.user?.role === 'ADMIN' || 
                         (session?.user?.id === request.requesterId && request.status === 'PENDING')) && (
                          <button
                            onClick={() => handleEditRequestClick(request)}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="Edit Request"
                          >
                            <Edit className="h-5 w-5" />
                          </button>
                        )}
                        {(session?.user?.role === 'ADMIN' || 
                         session?.user?.id === request.requesterId) && (
                          <button
                            onClick={() => setRequestToDelete(request)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete Request"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {/* Mobile Card View */}
          <div className="lg:hidden">
            {isLoading ? (
              <div className="text-center py-8 text-gray-500">
                Loading requests...
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No requests found
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {filteredRequests.map((request) => (
                  <div key={request.id} className="p-4 hover:bg-gray-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">
                          {request.title}
                        </div>
                        <div className="text-sm text-gray-500 mt-1">
                          {request.description}
                        </div>
                        <div className="flex items-center mt-2 space-x-4">
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">By:</span> {request.requester}
                          </div>
                          <div className="text-xs text-gray-500">
                            <span className="font-medium">Dept:</span> {request.department}
                          </div>
                        </div>
                        <div className="flex items-center mt-2 space-x-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[request.status]}`}>
                            {request.status.replace('_', ' ')}
                          </span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${priorityColors[request.priority]}`}>
                            {request.priority}
                          </span>
                        </div>
                        <div className="flex items-center justify-between mt-3">
                          <div className="text-sm font-medium text-gray-900">
                            ${request.totalAmount.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {request.createdAt}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {request.items.length} item{request.items.length !== 1 ? 's' : ''}
                          {request.expectedDelivery && (
                            <span className="ml-2">• Expected: {request.expectedDelivery}</span>
                          )}
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewRequest(request)}
                            className="text-blue-600 hover:text-blue-900 p-1"
                            title="View Request"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {(session?.user?.role === 'ADMIN' || 
                           (session?.user?.id === request.requesterId && request.status === 'PENDING')) && (
                            <button
                              onClick={() => handleEditRequestClick(request)}
                              className="text-indigo-600 hover:text-indigo-900 p-1"
                              title="Edit Request"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {(session?.user?.role === 'ADMIN' || 
                           session?.user?.id === request.requesterId) && (
                            <button
                              onClick={() => setRequestToDelete(request)}
                              className="text-red-600 hover:text-red-900 p-1"
                              title="Delete Request"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {filteredRequests.length === 0 && (
            <div className="text-center py-12">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || statusFilter !== 'ALL' || priorityFilter !== 'ALL' || departmentFilter !== 'ALL' || dateRange.start || dateRange.end
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by creating a new request.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add Request Modal */}
      <RequestModal
        isOpen={isNewRequestModalOpen && !editingRequest && !viewingRequest}
        onClose={() => {
          setIsNewRequestModalOpen(false)
          setIsReadOnly(false)
        }}
        onSave={handleAddRequest}
        mode="add"
        readOnly={false}
      />

      {/* Edit Request Modal */}
      <RequestModal
        isOpen={!!editingRequest}
        onClose={() => {
          setEditingRequest(null)
          setIsNewRequestModalOpen(false)
          setIsReadOnly(false)
        }}
        onSave={handleEditRequest}
        request={editingRequest}
        mode="edit"
        readOnly={false}
      />

      {/* View Request Modal */}
      <RequestModal
        isOpen={!!viewingRequest}
        onClose={() => {
          setViewingRequest(null)
          setIsNewRequestModalOpen(false)
          setIsReadOnly(false)
        }}
        onSave={() => {}}
        request={viewingRequest}
        mode="view"
        readOnly={true}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!requestToDelete}
        onClose={() => setRequestToDelete(null)}
        onConfirm={handleDeleteRequest}
        type="delete"
        entityType="request"
        entityName={requestToDelete?.title}
        isLoading={isDeleting}
      />
    </DashboardLayout>
  )
}
