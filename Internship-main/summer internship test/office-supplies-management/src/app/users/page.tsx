'use client'

import { useEffect, useState } from 'react'
 import { DashboardLayout } from '@/components/layout/dashboard-layout'
 import { Users, Plus, Search, Shield, User, Crown, Edit, Eye, Filter, Download, Trash } from 'lucide-react'
import { UserModal } from '@/components/modals/UserModal'
import { Modal, ConfirmModal } from '@/components/ui/modal'
import { ConfirmationModal } from '@/components/ui/confirmation-modal'
import { ExportButton } from '@/components/ui/export'

interface User {
  id: string
  name: string
  email: string
  role: 'ADMIN' | 'MANAGER' | 'EMPLOYEE'
  department: string
  status: 'ACTIVE' | 'INACTIVE'
  lastSignIn?: string
  createdAt?: string
  updatedAt?: string
  phone?: string
  position?: string
  joinDate?: string
  permissions?: string[]
}

const getRoleIcon = (role: string) => {
  switch (role) {
    case 'ADMIN': return <Crown className="h-5 w-5 text-yellow-600" />
    case 'MANAGER': return <Shield className="h-5 w-5 text-blue-600" />
    case 'EMPLOYEE': return <User className="h-5 w-5 text-gray-600" />
    default: return <User className="h-5 w-5 text-gray-600" />
  }
}

const getRoleColor = (role: string) => {
  switch (role) {
    case 'ADMIN': return 'bg-yellow-100 text-yellow-800 border border-yellow-300'
    case 'MANAGER': return 'bg-blue-100 text-blue-800 border border-blue-300'
    case 'EMPLOYEE': return 'bg-gray-100 text-gray-800 border border-gray-300'
    default: return 'bg-gray-100 text-gray-800 border border-gray-300'
  }
}

const getStatusColor = (status: string) => {
  return status === 'ACTIVE' 
    ? 'bg-green-100 text-green-800' 
    : 'bg-red-100 text-red-800'
}

export default function UsersPage() {
    const [users, setUsers] = useState<User[]>([])

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await fetch('/api/users');
        if (!response.ok) {
          throw new Error('Failed to fetch users');
        }
        const data = await response.json();
        setUsers(data);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };

    fetchUsers();
  }, []);
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [departmentFilter, setDepartmentFilter] = useState('ALL')
  const [showFilters, setShowFilters] = useState(false)
  
  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [viewingUser, setViewingUser] = useState<User | null>(null)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [userToDeactivate, setUserToDeactivate] = useState<User | null>(null)
  const [userToDelete, setUserToDelete] = useState<User | null>(null)
  const [isReadOnly, setIsReadOnly] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDeactivating, setIsDeactivating] = useState(false)
  
  // Get unique departments for filter
  const departments = Array.from(new Set(users.map(user => user.department)))
  
  const handleAddUser = async (userData: Partial<User>, password?: string) => {
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...userData, password }),
      });
      if (!response.ok) {
        throw new Error('Failed to add user');
      }
      const newUser = await response.json();
      setUsers([...users, newUser]);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding user:', error);
    }
  };
  
  const handleEditUser = async (userData: Partial<User>) => {
    if (!editingUser) return;
    try {
      const response = await fetch(`/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });
      if (!response.ok) {
        throw new Error('Failed to edit user');
      }
      const updatedUser = await response.json();
      setUsers(users.map(user => (user.id === editingUser.id ? updatedUser : user)));
      setEditingUser(null);
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error editing user:', error);
    }
  };

  const handleViewUser = (user: User) => {
    setViewingUser(user)
    setIsReadOnly(true)
    setIsAddModalOpen(true)
  }
  
  const handleDeactivateUser = async () => {
    if (!userToDeactivate) return;
    setIsDeactivating(true);
    try {
      const newStatus = userToDeactivate.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
      const response = await fetch(`/api/users/${userToDeactivate.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) {
        throw new Error(`Failed to ${newStatus === 'INACTIVE' ? 'deactivate' : 'activate'} user`);
      }
      const updatedUser = await response.json();
      setUsers(users.map(u => (u.id === userToDeactivate.id ? updatedUser : u)));
      setUserToDeactivate(null);
    } catch (error) {
      console.error('Error updating user status:', error);
    } finally {
      setIsDeactivating(false);
    }
  };

  const handleActivateUser = (user: User) => {
    setUserToDeactivate(user);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to delete user');
      }
      setUsers(users.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setIsDeleting(false);
    }
  };
  
  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.department.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
    const matchesDepartment = departmentFilter === 'ALL' || user.department === departmentFilter
    return matchesSearch && matchesRole && matchesStatus && matchesDepartment
  })
  
  const exportData = filteredUsers.map(user => ({
    Name: user.name,
    Email: user.email,
    Role: user.role,
    Department: user.department,
    Status: user.status,
    Position: user.position || '',
    Phone: user.phone || '',
    'Join Date': user.joinDate || '',
    'Last Login': user.lastSignIn || 'Never',
    'Created At': user.createdAt ? new Date(user.createdAt).toLocaleString() : '',
    'Updated At': user.updatedAt ? new Date(user.updatedAt).toLocaleString() : ''
  }))

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users</h1>
            <p className="text-gray-600">Manage user accounts and permissions</p>
          </div>
          <div className="flex gap-2">
            <ExportButton
              data={exportData}
              filename="users"
              variant="primary"
            />
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add User
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
                placeholder="Search users by name, email, or department..."
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="MANAGER">Manager</option>
                  <option value="EMPLOYEE">Employee</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ALL">All Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
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
                  {departments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Users Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">
              Users ({filteredUsers.length})
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Department
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Login
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Users className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleIcon(user.role)}
                          <span className="text-xs font-semibold">
                            {user.role === 'ADMIN' ? 'Administrator' : 
                             user.role === 'MANAGER' ? 'Manager' : 'Employee'}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {user.department}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(user.status)}`}>
                        {user.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.lastSignIn}
                    </td>
                    <td className="px-6 py-4 text-sm font-medium">
                      <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handleViewUser(user)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Eye className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => {
                      setEditingUser(user)
                      setIsAddModalOpen(true)
                    }}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <Edit className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => setUserToDelete(user)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                  {user.status === 'ACTIVE' ? (
                    <button
                      onClick={() => setUserToDeactivate(user)}
                      className="text-red-600 hover:text-red-800 flex items-center gap-1"
                    >
                      <span className="text-sm">Deactivate</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setUserToDeactivate(user)}
                      className="text-green-600 hover:text-green-800 flex items-center gap-1"
                    >
                      <span className="text-sm">Activate</span>
                    </button>
                  )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || roleFilter !== 'ALL' || statusFilter !== 'ALL' || departmentFilter !== 'ALL'
                  ? 'Try adjusting your search or filter criteria.'
                  : 'Get started by adding a new user.'}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Add User Modal */}
      <UserModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false)
          setEditingUser(null)
          setViewingUser(null)
          setIsReadOnly(false)
        }}
        onSave={editingUser ? handleEditUser : handleAddUser}
        user={editingUser || viewingUser}
        mode={editingUser ? 'edit' : (viewingUser ? 'view' : 'add')}
        readOnly={isReadOnly}
      />

      {/* Edit User Modal */}
      {editingUser && (
        <UserModal
          isOpen={!!editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleEditUser}
          mode="edit"
          title="Edit User"
          initialData={editingUser}
        />
      )}

      {/* View User Modal */}
      {viewingUser && (
        <UserModal
          isOpen={isViewModalOpen}
          onClose={() => {
            setIsViewModalOpen(false)
            setViewingUser(null)
          }}
          mode="view"
          title="User Details"
          initialData={viewingUser}
          readOnly={true}
        />
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        onConfirm={handleDeleteUser}
        type="delete"
        entityType="user"
        entityName={userToDelete?.name}
        isLoading={isDeleting}
      />

      {/* Deactivate/Activate Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!userToDeactivate}
        onClose={() => setUserToDeactivate(null)}
        onConfirm={handleDeactivateUser}
        type={userToDeactivate?.status === 'ACTIVE' ? 'deactivate' : 'warning'}
        entityType="user"
        entityName={userToDeactivate?.name}
        isLoading={isDeactivating}
        customTitle={userToDeactivate?.status === 'ACTIVE' ? 'Deactivate User' : 'Activate User'}
        customMessage={userToDeactivate?.status === 'ACTIVE' 
          ? 'This user will lose access to the system.'
          : 'This user will regain access to the system.'}
        customConfirmText={userToDeactivate?.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
      />
    </DashboardLayout>
  )
}
