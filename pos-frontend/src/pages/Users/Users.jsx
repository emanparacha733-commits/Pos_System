import { useState, useEffect } from 'react'
import Layout from '../../components/Layout'
import API from '../../utils/api'
import {
  MdAdd, MdEdit, MdDelete, MdSearch, MdClose,
  MdPerson, MdEmail, MdLock, MdShield, MdBusiness,
  MdVisibility, MdVisibilityOff
} from 'react-icons/md'

// ─── User Modal (Add/Edit) ─────────────────────────────────────────
const UserModal = ({ editUser, onClose, onDone }) => {
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [form, setForm] = useState({
    username: editUser?.username || '',
    email: editUser?.email || '',
    password: '',
    role: editUser?.role || 'cashier',
  })

  const f = (key, val) => setForm(prev => ({ ...prev, [key]: val }))

  const handleSubmit = async () => {
    if (!form.username) return alert('Username required!')
    if (!editUser && !form.password) return alert('Password required!')
    setLoading(true)
    try {
      if (editUser) {
        // Edit: password empty ho toh mat bhejo
        const payload = { username: form.username, email: form.email, role: form.role }
        if (form.password) payload.password = form.password
        await API.put(`/auth/users/${editUser.id}/`, payload)
      } else {
        await API.post('/auth/register/', form)
      }
      onDone()
      onClose()
    } catch (err) {
      const msg = err.response?.data
      alert(typeof msg === 'object' ? JSON.stringify(msg) : 'Error saving user!')
    } finally {
      setLoading(false)
    }
  }

  const roleColors = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    cashier: 'bg-green-100 text-green-700',
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-800">
            {editUser ? 'Edit User' : 'Add New User'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <MdClose size={20} />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Username */}
          <div className="relative">
            <MdPerson className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Username *"
              value={form.username}
              onChange={e => f('username', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Email */}
          <div className="relative">
            <MdEmail className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder="Email Address"
              type="email"
              value={form.email}
              onChange={e => f('email', e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Password */}
          <div className="relative">
            <MdLock className="absolute left-3 top-3 text-gray-400" size={18} />
            <input
              placeholder={editUser ? 'New Password (leave blank to keep)' : 'Password *'}
              type={showPassword ? 'text' : 'password'}
              value={form.password}
              onChange={e => f('password', e.target.value)}
              className="w-full pl-10 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <MdVisibilityOff size={18} /> : <MdVisibility size={18} />}
            </button>
          </div>

          {/* Role */}
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Role *</label>
            <div className="grid grid-cols-3 gap-2">
              {['cashier', 'manager', 'owner'].map(role => (
                <button
                  key={role}
                  onClick={() => f('role', role)}
                  className={`py-2 rounded-lg text-sm font-medium border transition capitalize ${
                    form.role === role
                      ? roleColors[role] + ' border-transparent'
                      : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 p-4 border-t">
          <button
            onClick={onClose}
            className="flex-1 py-2 border border-gray-200 rounded-xl text-gray-600 text-sm hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Saving...' : editUser ? 'Update' : 'Add User'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main Users Component ──────────────────────────────────────────
const Users = () => {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [userModal, setUserModal] = useState(false)
  const [editUser, setEditUser] = useState(null)
  const [myRole, setMyRole] = useState(null)

  useEffect(() => {
    fetchMyRole()
    fetchUsers()
  }, [])

  const fetchMyRole = async () => {
    try {
      const res = await API.get('/auth/me/')
      setMyRole(res.data.role)
    } catch (err) {
      console.error(err)
    }
  }

  const fetchUsers = async () => {
    try {
      const res = await API.get('/auth/users/')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this user?')) return
    try {
      await API.delete(`/auth/users/${id}/`)
      fetchUsers()
    } catch (err) {
      alert('Error deleting user!')
    }
  }

  const isOwner = myRole === 'owner'

  const filteredUsers = users.filter(u =>
    u.username?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase())
  )

  const roleColors = {
    owner: 'bg-purple-100 text-purple-700',
    manager: 'bg-blue-100 text-blue-700',
    cashier: 'bg-green-100 text-green-700',
  }

  const roleCounts = {
    owner: users.filter(u => u.role === 'owner').length,
    manager: users.filter(u => u.role === 'manager').length,
    cashier: users.filter(u => u.role === 'cashier').length,
  }

  return (
    <Layout>
      <div className="space-y-4">

        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Users</h1>
            <p className="text-gray-500 text-sm">Manage your staff accounts</p>
          </div>
          {isOwner && (
            <button
              onClick={() => { setEditUser(null); setUserModal(true) }}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              <MdAdd size={20} /> Add User
            </button>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdShield size={18} className="text-purple-600" />
              <p className="text-xs text-gray-500">Owners</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{roleCounts.owner}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdBusiness size={18} className="text-blue-600" />
              <p className="text-xs text-gray-500">Managers</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{roleCounts.manager}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-4">
            <div className="flex items-center gap-2 mb-1">
              <MdPerson size={18} className="text-green-600" />
              <p className="text-xs text-gray-500">Cashiers</p>
            </div>
            <p className="text-2xl font-bold text-gray-800">{roleCounts.cashier}</p>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="relative">
            <MdSearch className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search by username, email or role..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
              <tr>
                <th className="px-4 py-3 text-left">User</th>
                <th className="px-4 py-3 text-left">Email</th>
                <th className="px-4 py-3 text-left">Role</th>
                {isOwner && <th className="px-4 py-3 text-left">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isOwner ? 4 : 3} className="text-center py-10">
                    <MdPerson size={40} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400">No users found</p>
                  </td>
                </tr>
              ) : filteredUsers.map(user => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-sm flex-shrink-0">
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-800">{user.username}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{user.email || '-'}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium capitalize ${roleColors[user.role] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role}
                    </span>
                  </td>
                  {isOwner && (
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => { setEditUser(user); setUserModal(true) }}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <MdEdit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MdDelete size={18} />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {userModal && (
        <UserModal
          editUser={editUser}
          onClose={() => { setUserModal(false); setEditUser(null) }}
          onDone={fetchUsers}
        />
      )}
    </Layout>
  )
}

export default Users