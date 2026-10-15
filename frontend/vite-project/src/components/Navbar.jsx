import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { logoutUser } from '../services/api'

function Navbar({ isAuthenticated, onLogout }) {
  const navigate = useNavigate()
  const { totalItemCount } = useCart()

  const handleLogout = async () => {
    try {
      await logoutUser()
    } finally {
      onLogout()
      navigate('/login')
    }
  }

  return (
    <header className="border-b border-[#dfe6dc] bg-[#f5f7f2]/95">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5 lg:px-8">
        <Link to={isAuthenticated ? '/me' : '/login'} className="text-xl font-bold tracking-tight">Shop<span className="text-[#e56b45]">Kart</span></Link>
        <div className="flex items-center gap-5 text-sm font-semibold">
          {isAuthenticated && <><Link to="/me" className="text-[#536157] transition hover:text-[#e56b45]">Home</Link><Link to="/products" className="text-[#536157] transition hover:text-[#e56b45]">Products</Link><Link to="/wishlist" className="text-[#536157] transition hover:text-[#e56b45]">Wishlist</Link><Link to="/cart" className="text-[#536157] transition hover:text-[#e56b45]">Cart ({totalItemCount})</Link><Link to="/orders" className="text-[#536157] transition hover:text-[#e56b45]">Orders</Link></>}
          {isAuthenticated ? <button type="button" onClick={handleLogout} className="rounded-full border border-[#b9c7b7] px-4 py-2 transition hover:border-[#e56b45] hover:text-[#c74f2d]">Logout</button> : <><Link to="/login" className="text-[#536157] transition hover:text-[#e56b45]">Login</Link><Link to="/register" className="rounded-full bg-[#17211b] px-4 py-2 text-white transition hover:bg-[#e56b45]">Register</Link></>}
        </div>
      </nav>
    </header>
  )
}

export default Navbar