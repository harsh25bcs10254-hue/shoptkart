
import customers from '../models/customer.model.js'
import bcrypt from 'bcrypt'
import generateToken from '../utils/generateToken.js'

const authCookieOptions = {
    httpOnly: true,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000
}

const registerCustomer = async (req,res)=>{
    const {fullname,email,password,phoneno} = req.body
    
    if(!fullname||!email||!password||!phoneno){
        return res.status(400).json({message:'Missing field'})
    }
    
    const cst = await customers.findOne({email})


    if(cst){
        return res.status(409).json({message:'Email already exists'})
    }

    if(password.length<=6){
        return res.status(400).json({message:'password too short'})
    }


    const hashedPassword =await bcrypt.hash(password,10);


    try {
        const customer = await customers.create({
            fullname,
            email,
            password:hashedPassword,
            phoneno
        }
        )
        return res.status(201).json({
            success: true,
            message: 'Customer registered successfully',
            customer: {
                _id: customer._id,
                fullname: customer.fullname,
                email: customer.email,
                phoneno: customer.phoneno
            }
        })
    } catch (error) {
        return res.status(500).json({message: 'Unable to register customer'})
    }
}



const loginCustomer = async (req,res) => {
    const {email,password} = req.body
    if (!email || !password) {
        return res.status(400).json({message: "Email and password are required"})
    }

    const customer = await customers.findOne({email});
    if (!customer) {
        return res.status(401).json({
            message: "Invalid email or password"
        });
    }

    const isMatch = await bcrypt.compare(
        password,
        customer.password
    )
    if (!isMatch) {
    return res.status(401).json({
        message: "Invalid email or password"
    });
}

    const token = generateToken(customer._id)
    res.cookie('token', token, authCookieOptions)

    return res.status(200).json({
        message: "Login successful",
        token
    });

}

const getMyProfile = async (req,res)=>{
    return res.status(200).json({customer: req.user})
}

const logoutCustomer = (req,res)=>{
    res.clearCookie('token', authCookieOptions)

    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    })
}

export { registerCustomer, loginCustomer, getMyProfile, logoutCustomer }
