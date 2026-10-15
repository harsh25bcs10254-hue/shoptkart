import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000',
  withCredentials: true,
})

export const registerUser = (data) => api.post('/customers/register', data)
export const loginUser = (data) => api.post('/customers/login', data)
export const getProfile = () => api.get('/customers/me')
export const logoutUser = () => api.post('/customers/logout')
export const fetchProducts = (params) => api.get('/products', {params})
export const fetchProductById = (id) => api.get(`/products/${id}`)
export const getWishlist = () => api.get('/wishlist')
export const addProductToWishlist = (productId) => api.post(`/wishlist/${productId}`)
export const removeProductFromWishlist = (productId) => api.delete(`/wishlist/${productId}`)
export const fetchCart = () => api.get('/cart')
export const addProductToCart = (productId) => api.post(`/cart/${productId}`)
export const updateCartQuantity = (productId, quantity) => api.patch(`/cart/${productId}`, {quantity})
export const removeProductFromCart = (productId) => api.delete(`/cart/${productId}`)
export const createPaymentOrder = (shippingAddress) => api.post('/orders/create-payment-order', {shippingAddress})
export const verifyPayment = (paymentData) => api.post('/orders/verify-payment', paymentData)
export const fetchOrders = () => api.get('/orders')
export const fetchOrderById = (id) => api.get(`/orders/${id}`)

export default api