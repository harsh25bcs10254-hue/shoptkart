import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useWishlist } from '../context/useWishlist'
import { fetchProductById } from '../services/api'

function ProductDetails({ isAuthenticated }) {
  const {id} = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const [product, setProduct] = useState(null)
  const [status, setStatus] = useState('loading')
  const [loadedId, setLoadedId] = useState(null)
  const [wishlistError, setWishlistError] = useState('')
  const [cartError, setCartError] = useState('')
  const { addToCart, actionLoadingId } = useCart()
  const { addToWishlist, isInWishlist, loading: wishlistLoading } = useWishlist()

  useEffect(() => {
    let isCurrent = true
    fetchProductById(id)
      .then(({data}) => {
        if (isCurrent) {
          setProduct(data.product)
          setLoadedId(id)
          setStatus('success')
        }
      })
      .catch(() => {
        if (isCurrent) {
          setLoadedId(id)
          setStatus('error')
        }
      })

    return () => {
      isCurrent = false
    }
  }, [id])

  const viewStatus = loadedId === id ? status : 'loading'
  if (viewStatus === 'loading') return <p className="py-24 text-center text-[#68756b]">Loading product...</p>
  if (viewStatus === 'error') return <div className="mx-auto max-w-xl px-6 py-24 text-center"><h1 className="text-3xl font-bold">Product not found</h1><p className="mt-3 text-[#68756b]">This product may have been removed or the link is invalid.</p><Link to="/products" className="mt-7 inline-block rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white">Back to products</Link></div>

  const isOutOfStock = product.stock === 0
  const isSaved = isInWishlist(product._id)
  const isAddingToCart = actionLoadingId === product._id
  const handleAddToCart = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    setCartError('')
    try {
      await addToCart(product._id)
    } catch (error) {
      setCartError(error.message)
    }
  }

  const handleAddToWishlist = async () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } })
      return
    }

    setWishlistError('')
    try {
      await addToWishlist(product._id)
      navigate('/wishlist')
    } catch (error) {
      setWishlistError(error.message)
    }
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-6 py-12 lg:grid-cols-2 lg:px-8">
      <div className="aspect-square overflow-hidden rounded-[2rem] bg-[#edf2eb]"><img src={product.image} alt={product.name} className="h-full w-full object-cover" /></div>
      <div className="flex flex-col justify-center">
        <Link to="/products" className="text-sm font-bold text-[#c95333] hover:underline">Back to products</Link>
        <p className="mt-8 text-sm font-bold uppercase tracking-[0.24em] text-[#e56b45]">{product.category}</p>
        <h1 className="mt-3 text-5xl font-bold tracking-tight">{product.name}</h1>
        <p className="mt-6 text-3xl font-bold">${Number(product.price).toFixed(2)}</p>
        <p className="mt-6 max-w-xl leading-8 text-[#68756b]">{product.description}</p>
        <span className={`mt-7 w-fit rounded-full px-3 py-1 text-sm font-bold ${isOutOfStock ? 'bg-[#fff0eb] text-[#bd482a]' : 'bg-[#e7f1e4] text-[#417047]'}`}>{isOutOfStock ? 'Out of stock' : `${product.stock} available`}</span>
        <button type="button" onClick={handleAddToCart} disabled={isOutOfStock || isAddingToCart} className="mt-8 w-fit rounded-xl bg-[#17211b] px-6 py-3 font-bold text-white transition hover:bg-[#33483a] disabled:cursor-not-allowed disabled:opacity-50">
          {isOutOfStock ? 'Out of Stock' : isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
        {cartError && <p role="alert" className="mt-3 text-sm text-[#bd482a]">{cartError}</p>}
        <button type="button" onClick={handleAddToWishlist} disabled={isOutOfStock || wishlistLoading || isSaved} className="mt-3 w-fit rounded-xl bg-[#e56b45] px-6 py-3 font-bold text-white transition hover:bg-[#c95333] disabled:cursor-not-allowed disabled:opacity-50">
          {wishlistLoading ? 'Checking Wishlist...' : isSaved ? '♥ Added to Wishlist' : '♡ Add to Wishlist'}
        </button>
        {wishlistError && <p role="alert" className="mt-3 text-sm text-[#bd482a]">{wishlistError}</p>}
      </div>
    </section>
  )
}

export default ProductDetails
