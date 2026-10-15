import {useEffect, useState} from 'react'
import {Link, useParams} from 'react-router-dom'
import {fetchOrderById} from '../services/api'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(price)

function OrderDetails() {
  const {id} = useParams()
  const [order, setOrder] = useState(null)
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const loadOrder = async () => {
    setStatus('loading')
    setError('')
    try {
      const {data} = await fetchOrderById(id)
      setOrder(data.order)
      setStatus('success')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load this order.')
      setStatus('error')
    }
  }

  useEffect(() => {
    let isCurrent = true
    fetchOrderById(id)
      .then(({data}) => {
        if (isCurrent) {
          setOrder(data.order)
          setStatus('success')
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.response?.data?.message || 'Unable to load this order.')
          setStatus('error')
        }
      })
    return () => {
      isCurrent = false
    }
  }, [id])

  if (status === 'loading') return <p className="py-24 text-center text-[#68756b]">Loading order...</p>

  if (status === 'error') {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">Unable to load order</h1>
      <p role="alert" className="mt-4 text-[#68756b]">{error}</p>
      <button type="button" onClick={loadOrder} className="mt-8 rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white">Try Again</button>
      <Link to="/orders" className="ml-4 font-bold text-[#c95333]">Back to orders</Link>
    </section>
  }

  return <section className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
    <p className="text-sm font-bold uppercase tracking-[0.24em] text-[#e56b45]">Order confirmation</p>
    <h1 className="mt-2 break-all text-3xl font-bold">Order #{order._id}</h1>
    <p className="mt-3 text-[#68756b]">{new Date(order.createdAt).toLocaleString()}</p>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-4">
        <section className="rounded-2xl border border-[#dfe6dc] bg-white p-6">
          <h2 className="text-xl font-bold">Items</h2>
          <div className="mt-5 space-y-4">
            {order.items.map((item, index) => (
              <article key={`${item.product}-${index}`} className="flex gap-4">
                {item.image && <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />}
                <div className="flex-1">
                  <h3 className="font-bold">{item.name}</h3>
                  <p className="mt-1 text-sm text-[#68756b]">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <p className="font-semibold">{formatPrice(item.price * item.quantity)}</p>
              </article>
            ))}
          </div>
          <div className="mt-5 flex justify-between border-t border-[#e5eae3] pt-5 font-bold">
            <span>Total paid</span><span>{formatPrice(order.totalAmount)}</span>
          </div>
        </section>
        <section className="rounded-2xl border border-[#dfe6dc] bg-white p-6">
          <h2 className="text-xl font-bold">Shipping address</h2>
          <address className="mt-3 not-italic leading-7 text-[#536157]">
            {order.shippingAddress.fullName}<br />
            {order.shippingAddress.phone}<br />
            {order.shippingAddress.addressLine1}<br />
            {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.pincode}
          </address>
        </section>
      </div>
      <aside className="h-fit rounded-2xl border border-[#dfe6dc] bg-white p-6">
        <h2 className="text-xl font-bold">Payment</h2>
        <p className="mt-4 text-sm text-[#536157]">Payment status: <strong>{order.paymentStatus}</strong></p>
        <p className="mt-2 text-sm text-[#536157]">Order status: <strong>{order.status}</strong></p>
        {order.razorpayPaymentId && <p className="mt-3 break-all text-sm text-[#536157]">Payment ID: {order.razorpayPaymentId}</p>}
      </aside>
    </div>
    <div className="mt-8 flex gap-5">
      <Link to="/orders" className="font-bold text-[#c95333] hover:underline">Back to orders</Link>
      <Link to="/products" className="font-bold text-[#c95333] hover:underline">Continue shopping</Link>
    </div>
  </section>
}

export default OrderDetails
