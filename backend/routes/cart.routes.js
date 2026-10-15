import express from 'express'
import {
    addToCart,
    getCart,
    updateCartQuantity,
    removeFromCart
} from '../controllers/cart.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(authMiddleware)
router.get('/', getCart)
router.post('/:productId', addToCart)
router.patch('/:productId', updateCartQuantity)
router.delete('/:productId', removeFromCart)

export default router
