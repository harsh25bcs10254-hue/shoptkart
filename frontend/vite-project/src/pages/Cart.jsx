import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(price)

function Cart() {
  const navigate = useNavigate()
  const {
    cart,
    loading,
    error,
    fetchCart,
    updateQuantity,
    removeFromCart,
    totalItemCount,
    subtotal,
    actionLoadingId,
  } = useCart()

  if (loading) {
    return <p className="py-24 text-center text-[#68756b]">Loading your cart...</p>
  }

  if (error && cart.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">Unable to load your cart</h1>
      <p role="alert" className="mt-4 text-[#68756b]">{error}</p>
      <button type="button" onClick={fetchCart} className="mt-8 rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white transition hover:bg-[#e56b45]">Try Again</button>
    </section>
  }

  if (cart.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <p className="text-4xl" aria-hidden="true">🛒</p>
      <h1 className="mt-3 text-4xl font-bold">Your cart is empty 🛒</h1>
      <p className="mt-4 text-[#68756b]">Find something you’ll love and add it to your cart.</p>
      <Link to="/products" className="mt-8 inline-block rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white transition hover:bg-[#e56b45]">Browse Products</Link>
    </section>
  }

  const handleQuantityChange = async (productId, quantity) => {
    try {
      await updateQuantity(productId, quantity)
    } catch {
      // The shared cart error is displayed below.
    }
  }

  const handleRemove = async (productId) => {
    try {
      await removeFromCart(productId)
    } catch {
      // The shared cart error is displayed below.
    }
  }

  return <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
    <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#e56b45]">Your cart</p>
    <h1 className="mt-2 text-5xl font-bold tracking-tight">Ready when you are.</h1>
    {error && <p role="alert" className="mt-6 rounded-lg bg-[#fff0eb] px-4 py-3 text-sm text-[#bd482a]">{error}</p>}
    <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        {cart.map((item) => {
          const product = item.product
          if (!product) return null
          const productId = product._id
          const isUpdating = actionLoadingId === productId

          return <article key={productId} className="flex flex-col gap-4 rounded-2xl border border-[#dfe6dc] bg-white p-4 sm:flex-row">
            <img src={product.image} alt={product.name} className="h-36 w-full rounded-xl object-cover sm:h-32 sm:w-32" />
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold uppercase tracking-wider text-[#e56b45]">{product.category}</p>
              <h2 className="mt-1 truncate text-lg font-bold">{product.name}</h2>
              <p className="mt-2 text-sm text-[#68756b]">Unit price: {formatPrice(product.price)}</p>
              <p className="mt-1 font-semibold">Item total: {formatPrice(product.price * item.quantity)}</p>
              <div className="mt-4 flex items-center gap-3">
                <button
                  type="button"
                  aria-label={`Decrease ${product.name} quantity`}
                  onClick={() => handleQuantityChange(productId, item.quantity - 1)}
                  disabled={item.quantity === 1 || isUpdating}
                  className="h-9 w-9 rounded-lg border border-[#d5dfd3] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  −
                </button>
                <span aria-label="Quantity" className="min-w-6 text-center font-semibold">{item.quantity}</span>
                <button
                  type="button"
                  aria-label={`Increase ${product.name} quantity`}
                  onClick={() => handleQuantityChange(productId, item.quantity + 1)}
                  disabled={item.quantity >= product.stock || isUpdating}
                  className="h-9 w-9 rounded-lg border border-[#d5dfd3] font-bold disabled:cursor-not-allowed disabled:opacity-50"
                >
                  +
                </button>
                <button
                  type="button"
                  onClick={() => handleRemove(productId)}
                  disabled={isUpdating}
                  className="ml-2 rounded-lg px-3 py-2 text-sm font-bold text-[#bd482a] hover:bg-[#fff0eb] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Remove
                </button>
              </div>
            </div>
          </article>
        })}
      </div>

      <aside className="h-fit rounded-2xl border border-[#dfe6dc] bg-white p-6">
        <h2 className="text-xl font-bold">Order summary</h2>
        <div className="mt-5 flex justify-between gap-4 text-sm text-[#536157]">
          <span>Unique items</span>
          <span>{cart.length}</span>
        </div>
        <div className="mt-3 flex justify-between gap-4 text-sm text-[#536157]">
          <span>Total units</span>
          <span>{totalItemCount}</span>
        </div>
        <div className="mt-5 flex justify-between gap-4 border-t border-[#e5eae3] pt-5 font-bold">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/checkout')}
          className="mt-6 w-full rounded-xl bg-[#17211b] px-4 py-3 font-bold text-white transition hover:bg-[#e56b45]"
        >
          Proceed to Checkout
        </button>
      </aside>
    </div>
  </section>
}

export default Cart
