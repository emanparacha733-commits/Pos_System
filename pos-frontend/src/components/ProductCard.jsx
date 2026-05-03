import { useCart } from "../context/CartContext"
import { Link } from "react-router-dom"

export default function ProductCard({ product }) {
  const { addToCart } = useCart()

  return (
    <div className="bg-white p-3 shadow rounded">
      <h3 className="font-bold">{product.name}</h3>
      <p>Rs {product.price}</p>

      <div className="flex gap-2 mt-2">
        <Link to={`/product/${product.id}`} className="text-blue-600">
          View
        </Link>

        <button
          onClick={() => addToCart(product)}
          className="bg-blue-600 text-white px-2"
        >
          Add
        </button>
      </div>
    </div>
  )
}