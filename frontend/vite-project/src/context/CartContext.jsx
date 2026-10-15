import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import CartContext from './CartContextInstance'
import {
  addProductToCart,
  fetchCart as requestCart,
  removeProductFromCart,
  updateCartQuantity as requestCartQuantity,
} from '../services/api'

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

export function CartProvider({ children, isAuthenticated }) {
  const [cart, setCart] = useState([])
  const [loading, setLoading] = useState(Boolean(isAuthenticated))
  const [actionLoadingId, setActionLoadingId] = useState(null)
  const [error, setError] = useState(null)
  const actionQueue = useRef(Promise.resolve())

  const fetchCart = useCallback(async () => {
    if (!isAuthenticated) {
      setCart([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data } = await requestCart()
      setCart(data.cart || [])
    } catch (requestError) {
      setError(getErrorMessage(requestError, 'Unable to load your cart'))
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let isCurrent = true

    requestCart()
      .then(({ data }) => {
        if (isCurrent) {
          setCart(data.cart || [])
          setError(null)
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(getErrorMessage(requestError, 'Unable to load your cart'))
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [isAuthenticated])

  const runCartAction = useCallback((productId, action) => {
    const operation = actionQueue.current.then(async () => {
      setActionLoadingId(productId)
      setError(null)
      try {
        const { data } = await action()
        setCart(data.cart || [])
        return data.cart
      } catch (requestError) {
        const message = getErrorMessage(requestError, 'Unable to update your cart')
        setError(message)
        throw new Error(message)
      } finally {
        setActionLoadingId(null)
      }
    })
    actionQueue.current = operation.catch(() => {})
    return operation
  }, [])

  const addToCart = useCallback(
    (productId) => runCartAction(productId, () => addProductToCart(productId)),
    [runCartAction],
  )
  const updateQuantity = useCallback(
    (productId, newQuantity) => runCartAction(
      productId,
      () => requestCartQuantity(productId, newQuantity),
    ),
    [runCartAction],
  )
  const removeFromCart = useCallback(
    (productId) => runCartAction(productId, () => removeProductFromCart(productId)),
    [runCartAction],
  )
  const clearCartState = useCallback(() => {
    setCart([])
    setError(null)
  }, [])

  const value = useMemo(() => ({
    cart,
    loading,
    actionLoadingId,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCartState,
    totalItemCount: cart.reduce((total, item) => total + item.quantity, 0),
    subtotal: cart.reduce(
      (sum, item) => sum + ((item.product?.price || 0) * item.quantity),
      0,
    ),
  }), [
    cart,
    loading,
    actionLoadingId,
    error,
    fetchCart,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCartState,
  ])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}
