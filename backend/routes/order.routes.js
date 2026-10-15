import express from 'express'
import {
    createPaymentOrder,
    verifyPayment,
    getOrders,
    getOrderById
} from '../controllers/order.controller.js'
import authMiddleware from '../middlewares/auth.middleware.js'

const router = express.Router()

router.use(authMiddleware)
router.post('/create-payment-order', createPaymentOrder)
router.post('/verify-payment', verifyPayment)
router.get('/', getOrders)
router.get('/:id', getOrderById)

export default router
