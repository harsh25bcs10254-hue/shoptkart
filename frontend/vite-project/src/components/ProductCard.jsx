import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { useWishlist } from '../context/useWishlist'

function ProductCard({product}) {
  const isOutOfStock = product.stock === 0
  const [wishlistError, setWishlistError] = useState('')
  const [cartError, setCartError] = useState('')
  const { addToCart, actionLoadingId } = useCart()
  const { addToWishlist, isInWishlist, loading: wishlistLoading } = useWishlist()
  const isAddingToCart = actionLoadingId === product._id
  const isSaved = isInWishlist(product._id)

  const handleAddToCart = async () => {
    setCartError('')
    try {
      await addToCart(product._id)
    } catch (error) {
      setCartError(error.message)
    }
  }

  const handleAddToWishlist = async () => {
    setWishlistError('')
    try {
      await addToWishlist(product._id)
    } catch (error) {
      setWishlistError(error.message)
    }
  }

  return (
    <article className="overflow-hidden rounded-2xl border border-[#dfe6dc] bg-white shadow-[0_12px_35px_rgba(43,58,45,0.05)] transition hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(43,58,45,0.1)]">
      <div className="aspect-[4/3] overflow-hidden bg-[#edf2eb]">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
      </div>
      <div className="p-5">
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-[#e56b45]">{product.category}</span>
          <span className={`text-xs font-semibold ${isOutOfStock ? 'text-[#bd482a]' : 'text-[#68756b]'}`}>
            {isOutOfStock ? 'Out of stock' : `${product.stock} in stock`}
          </span>
        </div>
        <h2 className="mt-3 truncate text-xl font-bold">{product.name}</h2>
        <p className="mt-2 text-2xl font-bold text-[#17211b]">${Number(product.price).toFixed(2)}</p>
        <Link to={`/products/${product._id}`} className="mt-5 block rounded-xl bg-[#17211b] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#e56b45]">
          View Details
        </Link>
        <button
          type="button"
          onClick={handleAddToCart}
          disabled={isAddingToCart || isOutOfStock}
          className="mt-3 w-full rounded-xl bg-[#e56b45] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#c95333] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isOutOfStock ? 'Out of Stock' : isAddingToCart ? 'Adding...' : 'Add to Cart'}
        </button>
        {cartError && <p role="alert" className="mt-2 text-sm text-[#bd482a]">{cartError}</p>}
        <button
          type="button"
          onClick={handleAddToWishlist}
          disabled={wishlistLoading || isSaved}
          className="mt-3 w-full rounded-xl border border-[#d5dfd3] px-4 py-3 text-sm font-bold text-[#536157] transition hover:border-[#e56b45] hover:text-[#c95333] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {wishlistLoading ? 'Checking Wishlist...' : isSaved ? '♥ Added to Wishlist' : '♡ Add to Wishlist'}
        </button>
        {wishlistError && <p role="alert" className="mt-2 text-sm text-[#bd482a]">{wishlistError}</p>}
      </div>
    </article>
  )
}

export default ProductCard
