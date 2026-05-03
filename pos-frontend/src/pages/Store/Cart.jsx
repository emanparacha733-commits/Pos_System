import { useCart } from "../context/CartContext"
import { Link } from "react-router-dom"

export default function Cart() {
  const { cart, removeItem, updateQty } = useCart()

  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold">Cart</h1>

      {cart.map(item => (
        <div key={item.id} className="flex gap-3 mt-3">
          <p>{item.name}</p>
          <button onClick={() => updateQty(item.id, item.qty - 1)}>-</button>
          <span>{item.qty}</span>
          <button onClick={() => updateQty(item.id, item.qty + 1)}>+</button>
          <button onClick={() => removeItem(item.id)}>X</button>
        </div>
      ))}

      <h2 className="mt-4 font-bold">Total: Rs {total}</h2>

      <Link to="/checkout" className="bg-green-600 text-white px-4 py-2">
        Checkout
      </Link>
    </div>
  )
}