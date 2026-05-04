
import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(req: Request) {
  try {
    // Use environment variables only (MUST be set, no fallback keys)
    const key_id = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
    const key_secret = process.env.RAZORPAY_KEY_SECRET;

    if (!key_id || !key_secret) {
      console.error('Razorpay credentials not configured in environment variables');
      return NextResponse.json({ 
        error: 'Payment gateway not configured. Please contact support.' 
      }, { status: 500 });
    }

    const razorpay = new Razorpay({
      key_id,
      key_secret,
    });

    const body = await req.json();
    const { amount, currency = 'INR', receipt } = body;

    // Amount validation - in Paise. Minimum 100 paise (₹1)
    if (!amount || typeof amount !== 'number' || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum ₹1 is required for payment.' },
        { status: 400 }
      );
    }

    // Create order
    const options = {
      amount: Math.round(amount),
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
      notes: {
        app: 'AAGO Hub'
      }
    };

    const order = await razorpay.orders.create(options);
    
    // Return both order details and public key for frontend
    return NextResponse.json({
      ...order,
      keyId: key_id // Include public key for frontend
    });
  } catch (error: any) {
    console.error('Razorpay Order Creation Error:', error);
    
    let errorMessage = 'Failed to create payment order.';
    let statusCode = 500;
    
    if (error.statusCode === 401) {
      errorMessage = 'Authorization Failed: Invalid Razorpay credentials.';
      statusCode = 401;
    } else if (error.statusCode === 400) {
      errorMessage = error.error?.description || 'Invalid request parameters.';
      statusCode = 400;
    } else if (error.error?.description) {
      errorMessage = error.error.description;
    } else if (error.message) {
      errorMessage = error.message;
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
