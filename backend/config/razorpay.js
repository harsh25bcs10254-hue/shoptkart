import Razorpay from 'razorpay'

let razorpayInstance

export function getRazorpay() {
    const {RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET} = process.env
    if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
        throw new Error('Razorpay credentials are not configured')
    }

    if (!razorpayInstance) {
        razorpayInstance = new Razorpay({
            key_id: RAZORPAY_KEY_ID,
            key_secret: RAZORPAY_KEY_SECRET
        })
    }

    return razorpayInstance
}

export function getRazorpayKeyId() {
    if (!process.env.RAZORPAY_KEY_ID) {
        throw new Error('Razorpay key ID is not configured')
    }
    return process.env.RAZORPAY_KEY_ID
}
