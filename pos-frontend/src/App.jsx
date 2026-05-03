import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import POS from './pages/POS/POS'
import Inventory from './pages/Inventory/Inventory'
import Customers from './pages/Customers/Customers'
import Reports from './pages/Reports/Reports'
import BusinessProfile from './pages/Business/BusinessProfile'
import Users from './pages/Users/Users'
import Store from './pages/Store/Home'
import Orders from './pages/Orders/Orders'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-blue-600 text-xl font-medium">Loading...</p>
    </div>
  )
  return user ? children : <Navigate to="/login" />
}

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={
            <ProtectedRoute><Dashboard /></ProtectedRoute>
          } />
          <Route path="/pos" element={
            <ProtectedRoute><POS /></ProtectedRoute>
          } />
          <Route path="/inventory" element={
            <ProtectedRoute><Inventory /></ProtectedRoute>
          } />
          <Route path="/reports" element={
            <ProtectedRoute><Reports /></ProtectedRoute>
          } />
          <Route path="/customers" element={
            <ProtectedRoute><Customers /></ProtectedRoute>
          } />
          <Route path="/business" element={
            <ProtectedRoute><BusinessProfile /></ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute><Users /></ProtectedRoute>
          } />
          <Route path="/orders" element={
            <ProtectedRoute><Orders /></ProtectedRoute>
          } />
          <Route path="/store" element={<Store />} />
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )

  
}

export default App