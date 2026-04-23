import express from 'express';
import axios from 'axios';
import crypto from 'crypto';

const router = express.Router();

router.post('/create-order', async (req, res) => {
    try {
        const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        const { amount, currency = 'INR', purpose = 'Community contribution' } = req.body;
        const amountInRupees = Number(amount);

        if (!razorpayKeyId || !razorpayKeySecret) {
            return res.status(500).json({
                error: 'Razorpay credentials are missing on the server. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend .env.',
            });
        }

        if (!Number.isFinite(amountInRupees) || amountInRupees < 1) {
            return res.status(400).json({ error: 'Please provide a valid contribution amount.' });
        }

        const response = await axios.post(
            'https://api.razorpay.com/v1/orders',
            {
                amount: Math.round(amountInRupees * 100),
                currency,
                receipt: `stackit_${Date.now()}`,
                notes: {
                    purpose,
                },
            },
            {
                auth: {
                    username: razorpayKeyId,
                    password: razorpayKeySecret,
                },
                headers: {
                    'Content-Type': 'application/json',
                },
            }
        );

        res.json({ order: response.data });
    } catch (error) {
        console.error('Error creating Razorpay order:', error.response?.data || error.message);
        res.status(500).json({
            error: 'Failed to create Razorpay order.',
        });
    }
});

router.post('/verify', (req, res) => {
    try {
        const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
        const {
            razorpay_order_id: orderId,
            razorpay_payment_id: paymentId,
            razorpay_signature: signature,
        } = req.body;

        if (!razorpayKeySecret) {
            return res.status(500).json({
                error: 'Razorpay secret is missing on the server.',
            });
        }

        if (!orderId || !paymentId || !signature) {
            return res.status(400).json({ error: 'Missing payment verification details.' });
        }

        const expectedSignature = crypto
            .createHmac('sha256', razorpayKeySecret)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (expectedSignature !== signature) {
            return res.status(400).json({ error: 'Invalid payment signature.' });
        }

        res.json({
            success: true,
            message: 'Payment verified successfully.',
            paymentId,
            orderId,
        });
    } catch (error) {
        console.error('Error verifying Razorpay payment:', error.message);
        res.status(500).json({ error: 'Failed to verify payment.' });
    }
});

export default router;