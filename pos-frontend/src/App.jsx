import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Login from './pages/Auth/Login'
import Dashboard from './pages/Dashboard/Dashboard'
import POS from './pages/POS/POS'
import Inventory from './pages/Inventory/Inventory'
import Customers from './pages/Customers/Customers'
import Reports from './pages/Reports/Reports'
import BusinessProfile from './pages/Business/BusinessProfile'  

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
          <Route path="/Customers" element={
            <ProtectedRoute><Customers /></ProtectedRoute>
          } />
          <Route path="/Business" element={
            <ProtectedRoute><BusinessProfile /></ProtectedRoute>
          } />  {/*  */}
          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App