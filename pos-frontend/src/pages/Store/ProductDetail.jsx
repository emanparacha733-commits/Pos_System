import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import API from "../api/axios"
import { useCart } from "../context/CartContext"

export default function ProductDetail() {
  const { id } = useParams()
  const [product, setProduct] = useState(null)
  const { addToCart } = useCart()

  useEffect(() => {
    API.get(`/ecommerce/store/products/${id}/`)
      .then(res => setProduct(res.data))
  }, [id])

  if (!product) return <p>Loading...</p>

  return (
    <div className="p-10">
      <h1 className="text-2xl font-bold">{product.name}</h1>
      <p>{product.description}</p>
      <p className="text-blue-600 font-bold">
        Rs {product.price}
      </p>

      <button
        onClick={() => addToCart(product)}
        className="bg-blue-600 text-white px-4 py-2 mt-3"
      >
        Add to Cart
      </button>
    </div>
  )
}