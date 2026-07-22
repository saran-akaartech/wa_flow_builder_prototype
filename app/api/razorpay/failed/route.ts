import { NextResponse } from 'next/server';
import { markFailed } from '@/lib/payments';

export async function POST(request: Request) {
    const { error } = await request.json();

    console.error('Payment failed', {
        code: error?.code,
        description: error?.description,
        source: error?.source,
        step: error?.step,
        reason: error?.reason,
        order_id: error?.metadata?.order_id,
        payment_id: error?.metadata?.payment_id,
    });

    try {
        await markFailed({
            razorpayOrderId: error?.metadata?.order_id,
            razorpayPaymentId: error?.metadata?.payment_id,
            errorCode: error?.code,
            errorDescription: error?.description,
            errorSource: error?.source,
            errorStep: error?.step,
            errorReason: error?.reason,
        });
    } catch (dbErr) {
        console.error('Failed to persist failed payment', { dbErr });
    }

    return NextResponse.json({ success: true });
}
