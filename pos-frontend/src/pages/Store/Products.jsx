import { useEffect, useState } from "react"
import API from "../api/axios"
import ProductCard from "../components/ProductCard"

export default function Products() {
  const [products, setProducts] = useState([])

  useEffect(() => {
    API.get("/ecommerce/store/products/")
      .then(res => setProducts(res.data))
  }, [])

  return (
    <div className="grid grid-cols-4 gap-4 p-4">
      {products.map(p => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  )
}