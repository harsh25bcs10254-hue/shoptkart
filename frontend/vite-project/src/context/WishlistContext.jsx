import { useCallback, useEffect, useMemo, useState } from 'react'
import WishlistContext from './WishlistContextInstance'
import {
  addProductToWishlist,
  getWishlist,
  removeProductFromWishlist,
} from '../services/api'

function getErrorMessage(error, fallback) {
  return error.response?.data?.message || fallback
}

export function WishlistProvider({ children, isAuthenticated }) {
  const [wishlist, setWishlist] = useState([])
  const [loading, setLoading] = useState(Boolean(isAuthenticated))
  const [error, setError] = useState(null)

  const fetchWishlist = useCallback(async () => {
    if (!isAuthenticated) {
      setWishlist([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    try {
      const { data } = await getWishlist()
      setWishlist(data.wishlist || [])
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Unable to load your wishlist')
      setError(message)
      throw new Error(message)
    } finally {
      setLoading(false)
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (!isAuthenticated) return undefined
    let isCurrent = true

    getWishlist()
      .then(({ data }) => {
        if (isCurrent) {
          setWishlist(data.wishlist || [])
          setError(null)
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(getErrorMessage(requestError, 'Unable to load your wishlist'))
      })
      .finally(() => {
        if (isCurrent) setLoading(false)
      })

    return () => {
      isCurrent = false
    }
  }, [isAuthenticated])

  const addToWishlist = useCallback(async (productId) => {
    if (wishlist.some((product) => product._id === productId)) return

    setError(null)
    try {
      await addProductToWishlist(productId)
    } catch (requestError) {
      if (requestError.response?.status !== 409) {
        const message = getErrorMessage(requestError, 'Unable to save product to wishlist')
        setError(message)
        throw new Error(message)
      }
    }

    try {
      const { data } = await getWishlist()
      setWishlist(data.wishlist || [])
    } catch (refreshError) {
      const message = getErrorMessage(refreshError, 'Unable to refresh your wishlist')
      setError(message)
      throw new Error(message)
    }
  }, [wishlist])

  const removeFromWishlist = useCallback(async (productId) => {
    setError(null)
    try {
      await removeProductFromWishlist(productId)
      setWishlist((current) => current.filter((product) => product._id !== productId))
    } catch (requestError) {
      const message = getErrorMessage(requestError, 'Unable to remove product from wishlist')
      setError(message)
      throw new Error(message)
    }
  }, [])

  const value = useMemo(() => ({
    wishlist,
    loading,
    error,
    fetchWishlist,
    addToWishlist,
    removeFromWishlist,
    isInWishlist: (productId) => wishlist.some((product) => product._id === productId),
  }), [wishlist, loading, error, fetchWishlist, addToWishlist, removeFromWishlist])

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}
