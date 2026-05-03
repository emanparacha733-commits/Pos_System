export default function Login() {
  return (
    <div className="p-6">
      <h1 className="font-bold">Login</h1>
      <input placeholder="email" className="border p-2 mt-2 block" />
      <input placeholder="password" className="border p-2 mt-2 block" />
      <button className="bg-blue-600 text-white px-4 py-2 mt-3">
        Login
      </button>
    </div>
  )
}