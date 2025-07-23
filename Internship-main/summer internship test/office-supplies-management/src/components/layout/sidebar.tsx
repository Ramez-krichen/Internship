'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  ShoppingCart,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Activity,
  Zap
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Requests', href: '/requests', icon: FileText },
  { name: 'Inventory', href: '/inventory', icon: Package },
  { name: 'Suppliers', href: '/suppliers', icon: Building2 },
  { name: 'Purchase Orders', href: '/orders', icon: ShoppingCart },
  { name: 'Reports', href: '/reports', icon: BarChart3 },
  { name: 'Quick Reports', href: '/quick-reports', icon: Zap },
  { name: 'Users', href: '/users', icon: Users },
  { name: 'Audit Logs', href: '/audit-logs', icon: Activity, requiredRole: 'ADMIN' },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const handleSignOut = () => {
    signOut({ callbackUrl: '/auth/signin' })
  }

  return (
    <div className="flex h-full w-64 flex-col bg-gray-900">
      <div className="flex h-16 items-center justify-center bg-gray-800">
        <h1 className="text-xl font-bold text-white">Office Supplies</h1>
      </div>
      
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => {
          // Skip items that require a specific role if user doesn't have it
          if (item.requiredRole && session?.user?.role !== item.requiredRole) {
            return null
          }
          
          const isActive = pathname === item.href
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'group flex items-center px-2 py-2 text-sm font-medium rounded-md',
                isActive
                  ? 'bg-gray-800 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              )}
            >
              <item.icon
                className={cn(
                  'mr-3 h-5 w-5',
                  isActive ? 'text-white' : 'text-gray-400 group-hover:text-white'
                )}
              />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="border-t border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-1">
            <p className="text-sm font-medium text-white">{session?.user?.name}</p>
            <p className="text-xs text-gray-400">{session?.user?.email}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="ml-3 flex h-8 w-8 items-center justify-center rounded-md text-gray-400 hover:bg-gray-700 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  )
}
