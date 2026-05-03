import { Link } from "react-router-dom"
import { useCart } from "../context/CartContext"

export default function Navbar() {
  const { cart } = useCart()

  return (
    <div className="flex justify-between p-4 bg-white shadow">
      <Link to="/" className="font-bold">
        🛍 Stationery Store
      </Link>

      <div className="flex gap-4">
        <Link to="/products">Products</Link>
        <Link to="/cart">Cart ({cart.length})</Link>
        <Link to="/orders">Orders</Link>
        <Link to="/login">Login</Link>
      </div>
    </div>
  )
}