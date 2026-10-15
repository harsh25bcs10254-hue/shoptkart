import mongoose from 'mongoose'
import Product from '../models/product.model.js'

const addProductToWishlist = async (req, res) => {
    const {productId} = req.params
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({success: false, message: 'Invalid product ID'})
    }

    try {
        const product = await Product.findById(productId)
        if (!product) {
            return res.status(404).json({success: false, message: 'Product does not exist'})
        }

        if (req.user.wishlist.some((id) => id.toString() === productId)) {
            return res.status(409).json({success: false, message: 'Product already exists in wishlist'})
        }

        req.user.wishlist.push(product._id)
        await req.user.save()
        return res.status(201).json({success: true, message: 'Product added to wishlist'})
    } catch (error) {
        return res.status(500).json({success: false, message: 'Unable to add product to wishlist'})
    }
}

const getWishlist = async (req, res) => {
    try {
        await req.user.populate({
            path: 'wishlist',
            select: 'name price category image stock'
        })
        const wishlist = req.user.wishlist.filter(Boolean)
        return res.status(200).json({success: true, count: wishlist.length, wishlist})
    } catch (error) {
        return res.status(500).json({success: false, message: 'Unable to load wishlist'})
    }
}

const removeProductFromWishlist = async (req, res) => {
    const {productId} = req.params
    if (!mongoose.Types.ObjectId.isValid(productId)) {
        return res.status(400).json({success: false, message: 'Invalid product ID'})
    }

    const isInWishlist = req.user.wishlist.some((id) => id.toString() === productId)
    if (!isInWishlist) {
        return res.status(404).json({success: false, message: 'Product is not in wishlist'})
    }

    try {
        req.user.wishlist.pull(productId)
        await req.user.save()
        return res.status(200).json({success: true, message: 'Product removed from wishlist'})
    } catch (error) {
        return res.status(500).json({success: false, message: 'Unable to remove product from wishlist'})
    }
}

export {addProductToWishlist, getWishlist, removeProductFromWishlist}
