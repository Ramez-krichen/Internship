'use client'

import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { 
  FileText, 
  Package, 
  ShoppingCart, 
  AlertTriangle,
  TrendingUp,
  Users
} from 'lucide-react'

const stats = [
  {
    name: 'Pending Requests',
    value: '12',
    icon: FileText,
    color: 'bg-blue-500',
    change: '+2 from yesterday',
  },
  {
    name: 'Low Stock Items',
    value: '8',
    icon: AlertTriangle,
    color: 'bg-red-500',
    change: '+3 from last week',
  },
  {
    name: 'Active Orders',
    value: '5',
    icon: ShoppingCart,
    color: 'bg-green-500',
    change: '-1 from yesterday',
  },
  {
    name: 'Total Items',
    value: '247',
    icon: Package,
    color: 'bg-purple-500',
    change: '+12 from last month',
  },
]

const recentRequests = [
  {
    id: '1',
    title: 'Office Supplies for Marketing Team',
    requester: 'John Doe',
    status: 'Pending',
    amount: '$245.50',
    date: '2024-01-15',
  },
  {
    id: '2',
    title: 'Printer Paper and Toner',
    requester: 'Jane Smith',
    status: 'Approved',
    amount: '$89.99',
    date: '2024-01-14',
  },
  {
    id: '3',
    title: 'Cleaning Supplies',
    requester: 'Mike Johnson',
    status: 'In Progress',
    amount: '$156.75',
    date: '2024-01-13',
  },
]

export default function DashboardPage() {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to the Office Supplies Management System</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className={`${stat.color} p-3 rounded-md`}>
                      <stat.icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {stat.name}
                      </dt>
                      <dd className="text-lg font-medium text-gray-900">
                        {stat.value}
                      </dd>
                    </dl>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="text-sm text-gray-500">
                    {stat.change}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Requests */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Requests
            </h3>
            <div className="overflow-hidden">
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
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentRequests.map((request) => (
                    <tr key={request.id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {request.title}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.requester}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          request.status === 'Approved' 
                            ? 'bg-green-100 text-green-800'
                            : request.status === 'Pending'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.amount}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {request.date}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  )
}
