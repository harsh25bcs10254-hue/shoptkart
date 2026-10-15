import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/useCart'
import { createPaymentOrder, verifyPayment } from '../services/api'

const initialAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  city: '',
  state: '',
  pincode: '',
}

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(price)

function loadRazorpayScript() {
  if (window.Razorpay) return Promise.resolve(true)

  return new Promise((resolve) => {
    const existingScript = document.querySelector('#razorpay-checkout-script')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(Boolean(window.Razorpay)), {once: true})
      existingScript.addEventListener('error', () => resolve(false), {once: true})
      return
    }

    const script = document.createElement('script')
    script.id = 'razorpay-checkout-script'
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(Boolean(window.Razorpay))
    script.onerror = () => {
      script.remove()
      resolve(false)
    }
    document.body.appendChild(script)
  })
}

function Checkout() {
  const navigate = useNavigate()
  const {cart, loading: cartLoading, error: cartError, fetchCart, subtotal, clearCartState} = useCart()
  const [shippingAddress, setShippingAddress] = useState(initialAddress)
  const [errors, setErrors] = useState({})
  const [requestError, setRequestError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const validate = () => {
    const nextErrors = {}
    for (const [field, value] of Object.entries(shippingAddress)) {
      if (!value.trim()) nextErrors[field] = 'This field is required.'
    }
    const phoneDigits = shippingAddress.phone.replace(/\D/g, '')
    if (shippingAddress.phone && (!/^[+\d\s()-]+$/.test(shippingAddress.phone) || phoneDigits.length < 10 || phoneDigits.length > 15)) {
      nextErrors.phone = 'Enter a valid phone number.'
    }
    if (shippingAddress.pincode && !/^\d{6}$/.test(shippingAddress.pincode)) {
      nextErrors.pincode = 'Enter a 6-digit pincode.'
    }
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  const handleChange = (event) => {
    const {name, value} = event.target
    setShippingAddress((current) => ({...current, [name]: value}))
    setErrors((current) => ({...current, [name]: ''}))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setRequestError('')
    if (!validate() || cart.length === 0) return

    setIsSubmitting(true)
    try {
      const scriptLoaded = await loadRazorpayScript()
      if (!scriptLoaded) throw new Error('Unable to load Razorpay checkout. Check your connection and try again.')

      const {data} = await createPaymentOrder(shippingAddress)
      const checkout = new window.Razorpay({
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'ShopKart',
        description: 'Order Checkout',
        order_id: data.razorpayOrderId,
        prefill: {
          name: shippingAddress.fullName,
          contact: shippingAddress.phone,
        },
        handler: async (response) => {
          setIsSubmitting(true)
          setRequestError('')
          try {
            const verification = await verifyPayment({
              shopKartOrderId: data.shopKartOrderId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            })
            if (!verification.data.success) throw new Error('Payment verification failed.')
            clearCartState()
            navigate(`/orders/${data.shopKartOrderId}`, {replace: true})
          } catch (error) {
            setRequestError(error.response?.data?.message || error.message || 'Unable to verify payment.')
          } finally {
            setIsSubmitting(false)
          }
        },
        modal: {
          ondismiss: () => setIsSubmitting(false),
        },
        theme: {color: '#e56b45'},
      })

      checkout.on('payment.failed', (response) => {
        setIsSubmitting(false)
        setRequestError(response.error?.description || 'Payment failed. Your cart has not been cleared.')
      })
      checkout.open()
    } catch (error) {
      setRequestError(error.response?.data?.message || error.message || 'Unable to start checkout.')
      setIsSubmitting(false)
    }
  }

  if (cartLoading) return <p className="py-24 text-center text-[#68756b]">Loading your cart...</p>

  if (cartError && cart.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">Unable to load your cart</h1>
      <p role="alert" className="mt-4 text-[#68756b]">{cartError}</p>
      <button type="button" onClick={fetchCart} className="mt-8 rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white">Try Again</button>
    </section>
  }

  if (cart.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">Your cart is empty</h1>
      <Link to="/products" className="mt-8 inline-block rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white">Browse Products</Link>
    </section>
  }

  const fields = [
    ['fullName', 'Full Name', 'text'],
    ['phone', 'Phone', 'tel'],
    ['addressLine1', 'Address Line 1', 'text'],
    ['city', 'City', 'text'],
    ['state', 'State', 'text'],
    ['pincode', 'Pincode', 'text'],
  ]

  return <section className="mx-auto max-w-6xl px-6 py-12 lg:px-8">
    <Link to="/cart" className="text-sm font-bold text-[#c95333] hover:underline">Back to cart</Link>
    <h1 className="mt-3 text-4xl font-bold">Checkout</h1>
    <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
      <form onSubmit={handleSubmit} noValidate className="rounded-2xl border border-[#dfe6dc] bg-white p-6">
        <h2 className="text-xl font-bold">Shipping address</h2>
        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          {fields.map(([name, label, type]) => (
            <label key={name} className={`block text-sm font-semibold ${name === 'addressLine1' ? 'sm:col-span-2' : ''}`}>
              {label}
              <input
                name={name}
                type={type}
                value={shippingAddress[name]}
                onChange={handleChange}
                autoComplete={name === 'fullName' ? 'name' : name === 'phone' ? 'tel' : 'shipping address-line1'}
                className="mt-2 w-full rounded-xl border border-[#d5dfd3] px-4 py-3 outline-none focus:border-[#e56b45] focus:ring-2 focus:ring-[#e56b45]/15"
              />
              {errors[name] && <span role="alert" className="mt-1 block text-xs text-[#bd482a]">{errors[name]}</span>}
            </label>
          ))}
        </div>
        {requestError && <p role="alert" className="mt-5 rounded-lg bg-[#fff0eb] px-4 py-3 text-sm text-[#bd482a]">{requestError}</p>}
        <button type="submit" disabled={isSubmitting} className="mt-7 w-full rounded-xl bg-[#e56b45] px-4 py-3 font-bold text-white transition hover:bg-[#c95333] disabled:cursor-not-allowed disabled:opacity-60">
          {isSubmitting ? 'Processing...' : 'Place Order'}
        </button>
      </form>

      <aside className="h-fit rounded-2xl border border-[#dfe6dc] bg-white p-6">
        <h2 className="text-xl font-bold">Order summary</h2>
        <div className="mt-5 space-y-4">
          {cart.map((item) => item.product && (
            <div key={item.product._id} className="flex justify-between gap-4 text-sm">
              <span>{item.product.name} × {item.quantity}</span>
              <span className="shrink-0 font-semibold">{formatPrice(item.product.price * item.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-5 flex justify-between gap-4 border-t border-[#e5eae3] pt-5 font-bold">
          <span>Total</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
      </aside>
    </div>
  </section>
}

export default Checkout
