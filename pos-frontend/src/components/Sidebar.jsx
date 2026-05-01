import { NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { 
  MdDashboard, 
  MdPointOfSale, 
  MdInventory, 
  MdPeople, 
  MdBarChart,
  MdLogout,
  MdBusiness,
  MdShield
} from 'react-icons/md'

const Sidebar = () => {
  const { logout } = useAuth()

  const links = [
    { to: '/dashboard', icon: <MdDashboard size={20} />, label: 'Dashboard' },
    { to: '/pos', icon: <MdPointOfSale size={20} />, label: 'POS' },
    { to: '/inventory', icon: <MdInventory size={20} />, label: 'Inventory' },
    { to: '/customers', icon: <MdPeople size={20} />, label: 'Customers' },
    { to: '/reports', icon: <MdBarChart size={20} />, label: 'Reports' },
    { to: '/business', icon: <MdBusiness size={20} />, label: 'Business' },
    { to: '/users', icon: <MdShield size={20} />, label: 'Users' },
  ]

  return (
    <div className="w-64 min-h-screen bg-blue-700 text-white flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-blue-600">
        <h1 className="text-xl font-bold">POS System</h1>
        <p className="text-blue-300 text-sm mt-1">Business Management</p>
      </div>

      {/* Nav Links */}
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
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

      {/* Logout */}
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
}

export default Sidebar