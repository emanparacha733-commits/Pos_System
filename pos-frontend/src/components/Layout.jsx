import Sidebar from './Sidebar'

const Layout = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar />

      {/* Main content — mobile pe top padding (top bar ki wajah se) */}
      <main className="flex-1 p-4 md:p-6 overflow-auto pt-16 md:pt-6">
        {children}
      </main>
    </div>
  )
}

export default Layout