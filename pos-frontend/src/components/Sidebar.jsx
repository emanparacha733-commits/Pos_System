import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  MdDashboard, MdPointOfSale, MdInventory, MdPeople,
  MdBarChart, MdLogout, MdBusiness, MdShield,
  MdShoppingBag, MdMenu, MdClose
} from 'react-icons/md'

const Sidebar = () => {
  const { logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)

  const links = [
    { to: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
    { to: '/orders',    icon: <MdShoppingBag size={20} />, label: 'Orders' },
    { to: '/pos',       icon: <MdPointOfSale size={20} />, label: 'POS' },
    { to: '/inventory', icon: <MdInventory size={20} />, label: 'Inventory' },
    { to: '/customers', icon: <MdPeople size={20} />, label: 'Customers' },
    { to: '/reports',   icon: <MdBarChart size={20} />, label: 'Reports' },
    { to: '/business',  icon: <MdBusiness size={20} />, label: 'Business' },
    { to: '/users',     icon: <MdShield size={20} />, label: 'Users' },
  ]

  const SidebarContent = () => (
    <div className="w-64 min-h-screen bg-blue-700 text-white flex flex-col">
      <div className="p-6 border-b border-blue-600 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">POS System</h1>
          <p className="text-blue-300 text-sm mt-1">Business Management</p>
        </div>
        {/* Mobile close button */}
        <button
          className="md:hidden text-white"
          onClick={() => setIsOpen(false)}
        >
          <MdClose size={24} />
        </button>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            onClick={() => setIsOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg transition ${
                isActive
                  ? 'bg-white text-blue-700 font-medium'
                  : 'text-blue-100 hover:bg-blue-600'
              }`
            }
          >
            {link.icon}
            {link.label}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-blue-600">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-blue-100 hover:bg-blue-600 w-full transition"
        >
          <MdLogout size={20} />
          Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop Sidebar — hamesha visible */}
      <div className="hidden md:block">
        <SidebarContent />
      </div>

      {/* Mobile Top Bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-blue-700 text-white px-4 py-3 flex items-center justify-between shadow-md">
        <div>
          <h1 className="text-lg font-bold leading-tight">POS System</h1>
        </div>
        <button onClick={() => setIsOpen(true)}>
          <MdMenu size={26} />
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="md:hidden fixed inset-0 z-50 flex"
          onClick={() => setIsOpen(false)}
        >
          {/* Dark background */}
          <div className="absolute inset-0 bg-black/50" />
          {/* Sidebar drawer */}
          <div
            className="relative z-10"
            onClick={e => e.stopPropagation()}
          >
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}

export default Sidebar