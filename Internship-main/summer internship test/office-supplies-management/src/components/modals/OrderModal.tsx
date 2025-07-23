import React from 'react'

interface OrderItem {
  id?: string
  name: string
  quantity: number
  unitPrice: number
  totalPrice?: number
}

interface Order {
  id?: string
  orderNumber?: string
  supplier?: string
  status?: string
  totalAmount?: number
  orderDate?: string
  expectedDate?: string
  receivedDate?: string
  itemsCount?: number
  items?: OrderItem[]
  notes?: string
  priority?: string
  department?: string
  requestedBy?: string
  approvedBy?: string
  createdAt?: string
  updatedAt?: string
}

interface OrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave?: (order: Partial<Order>) => void
  order?: Order | null
  mode?: 'add' | 'edit' | 'view'
  readOnly?: boolean
  title?: string
  initialData?: Order
}

export const OrderModal: React.FC<OrderModalProps> = ({
  isOpen,
  onClose,
  onSave,
  order,
  mode = 'add',
  readOnly = false,
  title,
  initialData
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-lg p-6 relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">
          {title || (mode === 'add' ? 'Add Order' : mode === 'edit' ? 'Edit Order' : 'Order Details')}
        </h2>
        {/* Display order details or a simple form here. For now, just show JSON */}
        <pre className="bg-gray-100 p-2 rounded text-xs overflow-x-auto mb-4">
          {JSON.stringify(order || initialData, null, 2)}
        </pre>
        {!readOnly && onSave && (
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mr-2"
            onClick={() => onSave(order || {})}
          >
            Save
          </button>
        )}
        <button
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400"
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
