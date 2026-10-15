import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useWishlist } from '../context/useWishlist'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
}).format(price)

function Wishlist() {
  const [removingId, setRemovingId] = useState(null)
  const [removeError, setRemoveError] = useState('')
  const { wishlist: items, loading, error, fetchWishlist, removeFromWishlist } = useWishlist()

  const removeItem = async (id) => {
    setRemovingId(id)
    setRemoveError('')
    try {
      await removeFromWishlist(id)
    } catch (requestError) {
      setRemoveError(requestError.message)
    } finally {
      setRemovingId(null)
    }
  }

  if (loading) {
    return <p className="py-24 text-center text-[#68756b]">Loading your wishlist...</p>
  }

  if (error && items.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">Something went wrong.</h1>
      <p className="mt-4 text-[#68756b]">We couldn't load your wishlist.</p>
      <button type="button" onClick={() => { setRemoveError(''); fetchWishlist().catch((requestError) => setRemoveError(requestError.message)) }} className="mt-8 rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white transition hover:bg-[#e56b45]">Try Again</button>
    </section>
  }

  if (items.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-4xl" aria-hidden="true">❤️</p>
      <h1 className="mt-3 text-4xl font-bold">Your wishlist is empty</h1>
      <p className="mt-4 text-[#68756b]">Save products you love and find them here later.</p>
      <Link to="/products" className="mt-8 inline-block rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white transition hover:bg-[#e56b45]">Browse Products</Link>
    </section>
  }

  return <section className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
    <div className="flex items-end justify-between gap-5">
      <div>
        <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#e56b45]">Your wishlist</p>
        <h1 className="mt-2 text-5xl font-bold tracking-tight">Saved for later.</h1>
      </div>
      <Link to="/products" className="text-sm font-bold text-[#c95333] hover:underline">Continue shopping</Link>
    </div>
    {removeError && <p role="alert" className="mt-6 rounded-lg bg-[#fff0eb] px-4 py-3 text-sm text-[#bd482a]">{removeError}</p>}
    <div className="mt-10 space-y-4">
      {items.map((item) => <article key={item._id} className="flex flex-col gap-4 rounded-2xl border border-[#dfe6dc] bg-white p-4 sm:flex-row">
        <img src={item.image} alt={item.name} className="h-36 w-full rounded-xl object-cover sm:h-28 sm:w-28" />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-wider text-[#e56b45]">{item.category}</p>
          <h2 className="mt-1 truncate text-lg font-bold">{item.name}</h2>
          <p className="mt-2 text-xl font-bold">{formatPrice(item.price)}</p>
          <p className="mt-1 text-sm text-[#68756b]">{item.stock > 0 ? `${item.stock} units left` : 'Out of stock'}</p>
        </div>
        <div className="flex shrink-0 flex-col justify-center gap-2">
          <Link to={`/products/${item._id}`} className="rounded-xl bg-[#17211b] px-4 py-2 text-center text-sm font-bold text-white transition hover:bg-[#e56b45]">View Details</Link>
          <button type="button" onClick={() => removeItem(item._id)} disabled={removingId === item._id} className="rounded-xl border border-[#d5dfd3] px-4 py-2 text-sm font-bold text-[#bd482a] transition hover:border-[#bd482a] disabled:cursor-not-allowed disabled:opacity-60">
            {removingId === item._id ? 'Removing...' : 'Remove from Wishlist'}
          </button>
        </div>
      </article>)}
    </div>
  </section>
}

export default Wishlist
