import mongoose from 'mongoose'
import Product from '../models/product.model.js'

const invalidProductId = (res) => res.status(400).json({
    success: false,
    message: 'Invalid product ID'
})

const addToCart = async (req, res) => {
    const {productId} = req.params
    if (!mongoose.Types.ObjectId.isValid(productId)) return invalidProductId(res)

    try {
        const product = await Product.findById(productId)
        if (!product) return res.status(404).json({success: false, message: 'Product not found'})
        if (product.stock === 0) return res.status(400).json({success: false, message: 'Product out of stock'})

        const user = req.user
        const cartItem = user.cart.find((item) => item.product.toString() === productId)
        if (cartItem) {
            if (cartItem.quantity + 1 > product.stock) {
                return res.status(400).json({success: false, message: 'Requested quantity exceeds available stock'})
            }
            cartItem.quantity += 1
        } else {
            user.cart.push({product: product._id, quantity: 1})
        }

        await user.save()
        await user.populate('cart.product')
        return res.status(200).json({success: true, message: 'Cart updated', cart: user.cart})
    } catch (error) {
        return res.status(500).json({success: false, message: 'Unable to update cart'})
    }
}

const getCart = async (req, res) => {
    try {
        const user = req.user
        await user.populate('cart.product')
        const cart = user.cart.filter((item) => item.product)
        return res.status(200).json({success: true, cart})
    } catch (error) {
        return res.status(500).json({success: false, message: 'Unable to load cart'})
    }
}

const updateCartQuantity = async (req, res) => {
    const {productId} = req.params
    const quantity = req.body?.quantity
    if (!mongoose.Types.ObjectId.isValid(productId)) return invalidProductId(res)
    if (!Number.isInteger(quantity) || quantity < 1) {
        return res.status(400).json({success: false, message: 'Quantity must be a number greater than or equal to 1'})
    }

    try {
        const product = await Product.findById(productId)
        if (!product) return res.status(404).json({success: false, message: 'Product not found'})
        if (quantity > product.stock) {
            return res.status(400).json({success: false, message: 'Quantity exceeds available stock'})
        }

        const user = req.user
        const cartItem = user.cart.find((item) => item.product.toString() === productId)
        if (!cartItem) return res.status(404).json({success: false, message: 'Item not found in cart'})

        cartItem.quantity = quantity
        await user.save()
        await user.populate('cart.product')
        return res.status(200).json({success: true, message: 'Cart updated', cart: user.cart})
    } catch (error) {
        return res.status(500).json({success: false, message: 'Unable to update cart'})
    }
}

const removeFromCart = async (req, res) => {
    const {productId} = req.params
    if (!mongoose.Types.ObjectId.isValid(productId)) return invalidProductId(res)

    try {
        const user = req.user
        const itemIndex = user.cart.findIndex((item) => item.product.toString() === productId)
        if (itemIndex !== -1) user.cart.splice(itemIndex, 1)
        await user.save()
        await user.populate('cart.product')
        return res.status(200).json({success: true, message: 'Cart updated', cart: user.cart})
    } catch (error) {
        return res.status(500).json({success: false, message: 'Unable to update cart'})
    }
}

export {addToCart, getCart, updateCartQuantity, removeFromCart}
