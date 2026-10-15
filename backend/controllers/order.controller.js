import crypto from 'node:crypto'
import mongoose from 'mongoose'
import {getRazorpay, getRazorpayKeyId} from '../config/razorpay.js'
import Customer from '../models/customer.model.js'
import Order from '../models/order.model.js'
import Product from '../models/product.model.js'

const addressFields = ['fullName', 'phone', 'addressLine1', 'city', 'state', 'pincode']

const validateShippingAddress = (address) => {
    if (!address || typeof address !== 'object') return false
    if (addressFields.some((field) => typeof address[field] !== 'string' || !address[field].trim())) {
        return false
    }
    const phoneDigits = address.phone.replace(/\D/g, '')
    return /^[+\d\s()-]+$/.test(address.phone.trim())
        && phoneDigits.length >= 10
        && phoneDigits.length <= 15
        && /^\d{6}$/.test(address.pincode.trim())
}

const createPaymentOrder = async (req, res) => {
    const shippingAddress = req.body?.shippingAddress
    if (!validateShippingAddress(shippingAddress)) {
        return res.status(400).json({
            success: false,
            message: 'Provide a valid shipping address, 10–15 digit phone number, and 6-digit pincode'
        })
    }

    let razorpay
    let key
    try {
        razorpay = getRazorpay()
        key = getRazorpayKeyId()
    } catch (error) {
        return res.status(503).json({success: false, message: error.message})
    }

    let shopKartOrder
    try {
        const user = await Customer.findById(req.user._id).populate('cart.product')
        if (!user || !user.cart.length) {
            return res.status(400).json({success: false, message: 'Cart is empty'})
        }

        const items = []
        let totalAmount = 0
        for (const cartItem of user.cart) {
            const productId = cartItem.product?._id || cartItem.product
            const product = await Product.findById(productId)
            if (!product) {
                return res.status(400).json({success: false, message: 'A product in your cart is no longer available'})
            }
            if (product.stock < cartItem.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product: ${product.name}`
                })
            }

            items.push({
                product: product._id,
                name: product.name,
                price: product.price,
                quantity: cartItem.quantity,
                image: product.image
            })
            totalAmount += product.price * cartItem.quantity
        }

        totalAmount = Math.round(totalAmount * 100) / 100
        const amount = Math.round(totalAmount * 100)
        if (!Number.isSafeInteger(amount) || amount < 1) {
            return res.status(400).json({success: false, message: 'Order total is invalid'})
        }

        shopKartOrder = await Order.create({
            user: user._id,
            items,
            shippingAddress: Object.fromEntries(
                addressFields.map((field) => [field, shippingAddress[field].trim()])
            ),
            totalAmount,
            status: 'PENDING_PAYMENT',
            paymentStatus: 'PENDING'
        })

        const razorpayOrder = await razorpay.orders.create({
            amount,
            currency: 'INR',
            receipt: shopKartOrder._id.toString()
        })

        shopKartOrder.razorpayOrderId = razorpayOrder.id
        await shopKartOrder.save()

        return res.status(200).json({
            success: true,
            shopKartOrderId: shopKartOrder._id.toString(),
            razorpayOrderId: razorpayOrder.id,
            amount,
            currency: 'INR',
            key
        })
    } catch (error) {
        if (shopKartOrder) {
            try {
                await Order.updateOne(
                    {_id: shopKartOrder._id, paymentStatus: 'PENDING'},
                    {$set: {paymentStatus: 'FAILED'}}
                )
            } catch (updateError) {
                console.error('Unable to mark failed payment order:', updateError)
            }
        }
        console.error('Unable to create payment order:', error)
        return res.status(502).json({success: false, message: 'Unable to create payment order'})
    }
}

const verifyPayment = async (req, res) => {
    const {
        shopKartOrderId,
        razorpay_order_id: razorpayOrderId,
        razorpay_payment_id: razorpayPaymentId,
        razorpay_signature: razorpaySignature
    } = req.body || {}

    if (
        !mongoose.Types.ObjectId.isValid(shopKartOrderId)
        || !razorpayOrderId
        || !razorpayPaymentId
        || !razorpaySignature
    ) {
        return res.status(400).json({success: false, message: 'Invalid payment verification data'})
    }

    let keySecret
    try {
        getRazorpay()
        keySecret = process.env.RAZORPAY_KEY_SECRET
    } catch (error) {
        return res.status(503).json({success: false, message: error.message})
    }

    try {
        const order = await Order.findById(shopKartOrderId)
        if (!order) return res.status(404).json({success: false, message: 'Order not found'})
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({success: false, message: 'You do not own this order'})
        }

        if (order.paymentStatus === 'PAID') {
            return res.status(200).json({success: true, message: 'Payment already verified', order})
        }
        if (order.status !== 'PENDING_PAYMENT' || !order.razorpayOrderId) {
            return res.status(409).json({success: false, message: 'Order is not awaiting payment'})
        }

        const body = `${order.razorpayOrderId}|${razorpayPaymentId}`
        const expectedSignature = crypto
            .createHmac('sha256', keySecret)
            .update(body)
            .digest()
        const providedSignature = Buffer.from(razorpaySignature, 'hex')
        const signatureMatches = order.razorpayOrderId === razorpayOrderId
            && providedSignature.length === expectedSignature.length
            && crypto.timingSafeEqual(expectedSignature, providedSignature)

        if (!signatureMatches) {
            order.paymentStatus = 'FAILED'
            await order.save()
            return res.status(400).json({success: false, message: 'Invalid payment signature'})
        }

        const session = await mongoose.startSession()
        try {
            await session.withTransaction(async () => {
                const currentOrder = await Order.findById(shopKartOrderId).session(session)
                if (!currentOrder) throw new Error('Order not found')
                if (currentOrder.paymentStatus === 'PAID') return
                if (currentOrder.status !== 'PENDING_PAYMENT') throw new Error('Order is not awaiting payment')

                for (const item of currentOrder.items) {
                    const update = await Product.updateOne(
                        {_id: item.product, stock: {$gte: item.quantity}},
                        {$inc: {stock: -item.quantity}},
                        {session}
                    )
                    if (update.modifiedCount !== 1) {
                        throw new Error(`Insufficient stock for product: ${item.name}`)
                    }
                }

                const user = await Customer.findById(req.user._id).session(session)
                if (!user) throw new Error('Customer not found')
                user.cart = []
                await user.save({session})

                currentOrder.paymentStatus = 'PAID'
                currentOrder.status = 'PLACED'
                currentOrder.razorpayPaymentId = razorpayPaymentId
                await currentOrder.save({session})
            })
        } finally {
            await session.endSession()
        }

        const paidOrder = await Order.findById(shopKartOrderId)
            .populate('items.product', 'name image')
        return res.status(200).json({success: true, message: 'Payment verified', order: paidOrder})
    } catch (error) {
        console.error('Unable to verify payment:', error)
        return res.status(409).json({success: false, message: error.message || 'Unable to verify payment'})
    }
}

const getOrders = async (req, res) => {
    try {
        const orders = await Order.find({user: req.user._id})
            .sort({createdAt: -1})
        return res.status(200).json({success: true, orders})
    } catch (error) {
        console.error('Unable to load orders:', error)
        return res.status(500).json({success: false, message: 'Unable to load orders'})
    }
}

const getOrderById = async (req, res) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
        return res.status(400).json({success: false, message: 'Invalid order ID'})
    }

    try {
        const order = await Order.findById(req.params.id)
        if (!order) return res.status(404).json({success: false, message: 'Order not found'})
        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({success: false, message: 'You do not own this order'})
        }
        return res.status(200).json({success: true, order})
    } catch (error) {
        console.error('Unable to load order:', error)
        return res.status(500).json({success: false, message: 'Unable to load order'})
    }
}

export {createPaymentOrder, verifyPayment, getOrders, getOrderById}
