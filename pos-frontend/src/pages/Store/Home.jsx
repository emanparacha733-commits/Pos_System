import { Link } from "react-router-dom"

export default function Home() {
  return (
    <div className="p-10 text-center">
      <h1 className="text-3xl font-bold">
        Stationery Ecommerce Store
      </h1>

      <p className="mt-3 text-gray-500">
        Books • Pens • Copies • Office Supplies
      </p>

      <Link
        to="/products"
        className="mt-5 inline-block bg-blue-600 text-white px-4 py-2"
      >
        Shop Now
      </Link>
    </div>
  )
}