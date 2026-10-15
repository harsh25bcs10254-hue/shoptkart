import {useEffect, useState} from 'react'
import {Link} from 'react-router-dom'
import {fetchOrders} from '../services/api'

const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(price)

function Orders() {
  const [orders, setOrders] = useState([])
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')

  const loadOrders = async () => {
    setStatus('loading')
    setError('')
    try {
      const {data} = await fetchOrders()
      setOrders(data.orders)
      setStatus('success')
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load orders.')
      setStatus('error')
    }
  }

  useEffect(() => {
    let isCurrent = true
    fetchOrders()
      .then(({data}) => {
        if (isCurrent) {
          setOrders(data.orders)
          setStatus('success')
        }
      })
      .catch((requestError) => {
        if (isCurrent) {
          setError(requestError.response?.data?.message || 'Unable to load orders.')
          setStatus('error')
        }
      })
    return () => {
      isCurrent = false
    }
  }, [])

  if (status === 'loading') return <p className="py-24 text-center text-[#68756b]">Loading orders...</p>

  if (status === 'error') {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">Unable to load orders</h1>
      <p role="alert" className="mt-4 text-[#68756b]">{error}</p>
      <button type="button" onClick={loadOrders} className="mt-8 rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white">Try Again</button>
    </section>
  }

  if (orders.length === 0) {
    return <section className="mx-auto max-w-3xl px-6 py-24 text-center">
      <h1 className="text-4xl font-bold">You have not placed any orders yet.</h1>
      <Link to="/products" className="mt-8 inline-block rounded-xl bg-[#17211b] px-5 py-3 font-bold text-white">Start Shopping</Link>
    </section>
  }

  return <section className="mx-auto max-w-5xl px-6 py-12 lg:px-8">
    <h1 className="text-4xl font-bold">Your orders</h1>
    <div className="mt-8 space-y-4">
      {orders.map((order) => (
        <article key={order._id} className="rounded-2xl border border-[#dfe6dc] bg-white p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="font-bold">Order #{order._id}</h2>
              <p className="mt-1 text-sm text-[#68756b]">{new Date(order.createdAt).toLocaleString()}</p>
              <p className="mt-3 text-sm text-[#536157]">
                {order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}
              </p>
            </div>
            <div className="text-right">
              <p className="font-bold">{formatPrice(order.totalAmount)}</p>
              <p className="mt-2 text-xs font-semibold">{order.paymentStatus} · {order.status}</p>
              <Link to={`/orders/${order._id}`} className="mt-3 inline-block text-sm font-bold text-[#c95333] hover:underline">View Details</Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  </section>
}

export default Orders
