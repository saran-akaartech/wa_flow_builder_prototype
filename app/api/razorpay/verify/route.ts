import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { markAuthorizedOrCaptured } from '@/lib/payments';

export async function POST(request: Request) {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await request.json();

    const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex');

    const expected = Buffer.from(expectedSignature);
    const actual = Buffer.from(razorpay_signature ?? '');

    const isValid =
        expected.length === actual.length && crypto.timingSafeEqual(expected, actual);

    if (!isValid) {
        console.error('Payment verification failed', { razorpay_order_id, razorpay_payment_id });
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    console.log('Payment verified', { razorpay_order_id, razorpay_payment_id });

    try {
        await markAuthorizedOrCaptured({
            razorpayOrderId: razorpay_order_id,
            razorpayPaymentId: razorpay_payment_id,
            status: 'captured',
            paidAt: new Date(),
        });
    } catch (dbErr) {
        console.error('Failed to persist captured payment', { razorpay_order_id, razorpay_payment_id, dbErr });
    }

    return NextResponse.json({ success: true });
}
