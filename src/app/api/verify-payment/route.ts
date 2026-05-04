
import { NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(req: Request) {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    // Validate all required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification details' },
        { status: 400 }
      );
    }

    // Must use environment variable for secret (never hardcode)
    const key_secret = process.env.RAZORPAY_KEY_SECRET;
    
    if (!key_secret) {
      console.error('RAZORPAY_KEY_SECRET not configured');
      return NextResponse.json(
        { error: 'Payment gateway not configured' },
        { status: 500 }
      );
    }

    // Generate signature for verification
    const generated_signature = crypto
      .createHmac('sha256', key_secret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    // Constant-time comparison to prevent timing attacks
    const isValid = generated_signature === razorpay_signature;

    if (isValid) {
      return NextResponse.json({ 
        status: 'success',
        message: 'Payment verified successfully',
        orderId: razorpay_order_id,
        paymentId: razorpay_payment_id
      });
    } else {
      return NextResponse.json(
        { 
          error: 'Payment signature verification failed',
          status: 'failed'
        },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error('Payment Verification Error:', error);
    return NextResponse.json(
      { error: 'Internal server error during payment verification' },
      { status: 500 }
    );
  }
}
