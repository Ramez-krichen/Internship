'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { BarChart3, DollarSign, TrendingUp, Download, Calendar, Filter, Package, Users, Building2 } from 'lucide-react'

interface ReportData {
  consumptionReport: {
    totalItems: number
    totalConsumed: number
    topDepartments: Array<{ department: string; consumed: number }>
    topItems: Array<{ name: string; consumed: number; category: string }>
  }
  costAnalysis: {
    totalCost: number
    monthlySpend: number
    costByCategory: Array<{ category: string; cost: number }>
    costByDepartment: Array<{ department: string; cost: number }>
  }
  forecastReport: {
    predictedDemand: Array<{ item: string; predicted: number; current: number }>
    lowStockAlerts: Array<{ item: string; currentStock: number; reorderLevel: number }>
    seasonalTrends: Array<{ month: string; demand: number }>
  }
}

export default function QuickReportsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [reportData, setReportData] = useState<ReportData | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedPeriod, setSelectedPeriod] = useState('30') // days
  const [activeTab, setActiveTab] = useState('consumption')

  useEffect(() => {
    if (status === 'loading') return
    if (!session) {
      router.push('/auth/signin')
      return
    }
  }, [session, status, router])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      // Simulate API call - replace with actual API endpoints
      const mockData: ReportData = {
        consumptionReport: {
          totalItems: 156,
          totalConsumed: 2847,
          topDepartments: [
            { department: 'IT', consumed: 856 },
            { department: 'HR', consumed: 623 },
            { department: 'Finance', consumed: 445 },
            { department: 'Marketing', consumed: 398 },
            { department: 'Operations', consumed: 525 }
          ],
          topItems: [
            { name: 'A4 Paper', consumed: 245, category: 'Stationery' },
            { name: 'Ballpoint Pens', consumed: 189, category: 'Stationery' },
            { name: 'Printer Cartridges', consumed: 67, category: 'Electronics' },
            { name: 'Notebooks', consumed: 156, category: 'Stationery' },
            { name: 'Sticky Notes', consumed: 234, category: 'Stationery' }
          ]
        },
        costAnalysis: {
          totalCost: 45678.90,
          monthlySpend: 15226.30,
          costByCategory: [
            { category: 'Stationery', cost: 18456.20 },
            { category: 'Electronics', cost: 15234.50 },
            { category: 'Furniture', cost: 8967.10 },
            { category: 'Cleaning', cost: 3021.10 }
          ],
          costByDepartment: [
            { department: 'IT', cost: 18945.60 },
            { department: 'HR', cost: 8234.20 },
            { department: 'Finance', cost: 7456.30 },
            { department: 'Marketing', cost: 6789.40 },
            { department: 'Operations', cost: 4253.40 }
          ]
        },
        forecastReport: {
          predictedDemand: [
            { item: 'A4 Paper', predicted: 320, current: 150 },
            { item: 'Printer Cartridges', predicted: 85, current: 45 },
            { item: 'Notebooks', predicted: 200, current: 89 },
            { item: 'Ballpoint Pens', predicted: 250, current: 120 },
            { item: 'Sticky Notes', predicted: 180, current: 67 }
          ],
          lowStockAlerts: [
            { item: 'Printer Cartridges', currentStock: 12, reorderLevel: 20 },
            { item: 'A4 Paper', currentStock: 45, reorderLevel: 50 },
            { item: 'Stapler', currentStock: 3, reorderLevel: 10 }
          ],
          seasonalTrends: [
            { month: 'Jan', demand: 2340 },
            { month: 'Feb', demand: 2180 },
            { month: 'Mar', demand: 2890 },
            { month: 'Apr', demand: 2650 },
            { month: 'May', demand: 2420 },
            { month: 'Jun', demand: 2780 }
          ]
        }
      }
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      setReportData(mockData)
    } catch (error) {
      console.error('Error fetching report data:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) {
      fetchReportData()
    }
  }, [session, selectedPeriod])

  const exportReport = (type: string) => {
    // Simulate export functionality
    const filename = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`
    console.log(`Exporting ${filename}`)
    // In a real implementation, you would generate and download the CSV file
  }

  if (status === 'loading' || loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    )
  }

  if (!session) {
    return null
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Quick Reports</h1>
            <p className="text-gray-600">Instant insights into your office supplies management</p>
          </div>
          <div className="flex items-center space-x-2">
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
              <option value="365">Last year</option>
            </select>
          </div>
        </div>

        {/* Report Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            className={`bg-white p-6 rounded-lg shadow cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'consumption' ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setActiveTab('consumption')}
          >
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Consumption Report</h3>
                <p className="text-gray-600">Items consumed by department</p>
              </div>
            </div>
            {reportData && (
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">
                  {reportData.consumptionReport.totalConsumed.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total items consumed</div>
              </div>
            )}
          </div>

          <div 
            className={`bg-white p-6 rounded-lg shadow cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'cost' ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setActiveTab('cost')}
          >
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Cost Analysis</h3>
                <p className="text-gray-600">Detailed cost breakdown</p>
              </div>
            </div>
            {reportData && (
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">
                  ${reportData.costAnalysis.totalCost.toLocaleString()}
                </div>
                <div className="text-sm text-gray-500">Total cost</div>
              </div>
            )}
          </div>

          <div 
            className={`bg-white p-6 rounded-lg shadow cursor-pointer transition-all hover:shadow-md ${
              activeTab === 'forecast' ? 'ring-2 ring-indigo-500' : ''
            }`}
            onClick={() => setActiveTab('forecast')}
          >
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-gray-900">Forecast Report</h3>
                <p className="text-gray-600">Demand forecasting</p>
              </div>
            </div>
            {reportData && (
              <div className="mt-4">
                <div className="text-2xl font-bold text-gray-900">
                  {reportData.forecastReport.lowStockAlerts.length}
                </div>
                <div className="text-sm text-gray-500">Low stock alerts</div>
              </div>
            )}
          </div>
        </div>

        {/* Report Content */}
        {reportData && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeTab === 'consumption' && 'Consumption Report'}
                  {activeTab === 'cost' && 'Cost Analysis'}
                  {activeTab === 'forecast' && 'Forecast Report'}
                </h2>
                <button
                  onClick={() => exportReport(activeTab)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700 flex items-center gap-2"
                >
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>

            <div className="p-6">
              {activeTab === 'consumption' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Top Consuming Departments</h3>
                      <div className="space-y-3">
                        {reportData.consumptionReport.topDepartments.map((dept, index) => (
                          <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                                {index + 1}
                              </div>
                              <span className="ml-3 font-medium text-gray-900">{dept.department}</span>
                            </div>
                            <span className="text-gray-600">{dept.consumed} items</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Most Consumed Items</h3>
                      <div className="space-y-3">
                        {reportData.consumptionReport.topItems.map((item, index) => (
                          <div key={item.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-gray-400 mr-3" />
                              <div>
                                <div className="font-medium text-gray-900">{item.name}</div>
                                <div className="text-sm text-gray-500">{item.category}</div>
                              </div>
                            </div>
                            <span className="text-gray-600">{item.consumed}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'cost' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Cost by Category</h3>
                      <div className="space-y-3">
                        {reportData.costAnalysis.costByCategory.map((category) => (
                          <div key={category.category} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <Package className="h-5 w-5 text-green-500 mr-3" />
                              <span className="font-medium text-gray-900">{category.category}</span>
                            </div>
                            <span className="text-gray-600 font-semibold">${category.cost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Cost by Department</h3>
                      <div className="space-y-3">
                        {reportData.costAnalysis.costByDepartment.map((dept) => (
                          <div key={dept.department} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <Building2 className="h-5 w-5 text-blue-500 mr-3" />
                              <span className="font-medium text-gray-900">{dept.department}</span>
                            </div>
                            <span className="text-gray-600 font-semibold">${dept.cost.toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center">
                      <DollarSign className="h-5 w-5 text-blue-600 mr-2" />
                      <span className="font-medium text-blue-900">Monthly Average Spend: ${reportData.costAnalysis.monthlySpend.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'forecast' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Predicted Demand</h3>
                      <div className="space-y-3">
                        {reportData.forecastReport.predictedDemand.map((item) => (
                          <div key={item.item} className="p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{item.item}</span>
                              <span className="text-purple-600 font-semibold">{item.predicted}</span>
                            </div>
                            <div className="flex items-center text-sm text-gray-500">
                              <span>Current: {item.current}</span>
                              <span className="mx-2">•</span>
                              <span className={item.predicted > item.current ? 'text-orange-600' : 'text-green-600'}>
                                {item.predicted > item.current ? 'Increase needed' : 'Sufficient stock'}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900 mb-4">Low Stock Alerts</h3>
                      <div className="space-y-3">
                        {reportData.forecastReport.lowStockAlerts.map((alert) => (
                          <div key={alert.item} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-red-900">{alert.item}</span>
                              <span className="text-red-600 font-semibold">{alert.currentStock}</span>
                            </div>
                            <div className="text-sm text-red-700">
                              Reorder level: {alert.reorderLevel}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}