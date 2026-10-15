import express from 'express'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import cookieParser from 'cookie-parser'
import router from './routes/default.router.js'
import customersRoutes from './routes/customer.routes.js'
import productRoutes from './routes/product.routes.js'
import wishlistRoutes from './routes/wishlist.routes.js'
import cartRoutes from './routes/cart.routes.js'
import orderRoutes from './routes/order.routes.js'

dotenv.config()
const url = process.env.URL;
const port = process.env.PORT;
const allowedOrigins = [
    'http://localhost:5173',
    'http://localhost:5174',
    'http://127.0.0.1:5173',
    'http://127.0.0.1:5174'
]

const app = express()
app.use(express.json())
app.use(cookieParser())
app.use((req, res, next) => {
    const origin = req.headers.origin
    if (origin && allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin)
        res.setHeader('Access-Control-Allow-Credentials', 'true')
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS')
    }
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
})
app.use('/api', router)
app.use('/customers', customersRoutes)
app.use('/products', productRoutes)
app.use('/api/products', productRoutes)
app.use('/wishlist', wishlistRoutes)
app.use('/api/wishlist', wishlistRoutes)
app.use('/cart', cartRoutes)
app.use('/api/cart', cartRoutes)
app.use('/orders', orderRoutes)
app.use('/api/orders', orderRoutes)

mongoose
.connect(url)
.then(() => {
    console.log('connected to db')
})
.catch((err) => {
    console.log(err)
})

app.listen(port, () => {
    console.log(`server started at port ${port}`)
})
