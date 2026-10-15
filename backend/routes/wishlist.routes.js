import express from 'express'
import {
    addProductToWishlist,
    getWishlist,
    removeProductFromWishlist
} from '../controllers/wishlist.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(authMiddleware)
router.get('/', getWishlist)
router.post('/:productId', addProductToWishlist)
router.delete('/:productId', removeProductFromWishlist)

export default router
