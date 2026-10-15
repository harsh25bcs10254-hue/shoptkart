import mongoose from 'mongoose'
const customerSchema = new mongoose.Schema(
{
    fullname:{
        type:String,
        required:true
    },
    email:{
        type:String,
        required:true
    },
    password:{
        type:String,
        required:true
    },
    phoneno:{
        type:Number,
        require:true
    },
    wishlist: {
        type: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        }],
        default: []
    },
    cart: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            quantity: {
                type: Number,
                default: 1,
                min: [1, 'Quantity cannot be less than 1']
            }
        }
    ]
}
)

const customers = mongoose.model('customers',customerSchema)

export default customers