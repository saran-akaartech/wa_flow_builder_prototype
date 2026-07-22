import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getPaymentByOrderId, markAuthorizedOrCaptured, markFailed, markRefunded } from '@/lib/payments';

interface RazorpayPaymentEntity {
    id: string;
    order_id: string;
    method?: string;
    fee?: number;
    tax?: number;
    error_code?: string;
    error_description?: string;
    error_source?: string;
    error_step?: string;
    error_reason?: string;
}

interface RazorpayRefundEntity {
    payment_id: string;
    amount: number;
}

function isValidSignature(rawBody: string, signature: string | null): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret || !signature) return false;

    const expectedSignature = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    const expected = Buffer.from(expectedSignature);
    const actual = Buffer.from(signature);

    return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

export async function POST(request: Request) {
    const rawBody = await request.text();
    const signature = request.headers.get('x-razorpay-signature');
    const deliveryId = request.headers.get('x-razorpay-event-id');
    const ip = request.headers.get('x-forwarded-for');
    const userAgent = request.headers.get('user-agent');
    console.log("Signature ",signature)
    if (!isValidSignature(rawBody, signature)) {
        console.error('Razorpay webhook signature invalid', { deliveryId, ip });
        return NextResponse.json({ success: false, error: 'Invalid signature' }, { status: 400 });
    }

    let payload: any;
    try {
        payload = JSON.parse(rawBody);
    } catch (error) {
        console.error('Razorpay webhook payload parse error', error);
        return NextResponse.json({ success: false, error: 'Invalid payload' }, { status: 400 });
    }

    console.log('========== Razorpay Webhook ==========');
    console.log('Timestamp:', new Date().toISOString());
    console.log('Event:', payload?.event);
    console.log('Account:', payload?.account_id);
    console.log('Delivery ID:', deliveryId ?? 'unknown');
    console.log('User-Agent:', userAgent ?? 'unknown');
    console.log('Payload:', JSON.stringify(payload, null, 2));
    console.log('========================================');

    try {
        switch (payload?.event) {
            case 'payment.authorized': {
                const payment: RazorpayPaymentEntity = payload.payload.payment.entity;
                const existing = await getPaymentByOrderId(payment.order_id);
                if (existing && ['captured', 'refunded', 'partially_refunded'].includes(existing.Payment_Status)) break;

                await markAuthorizedOrCaptured({
                    razorpayOrderId: payment.order_id,
                    razorpayPaymentId: payment.id,
                    status: 'authorized',
                    paymentMethod: payment.method,
                });
                break;
            }

            case 'payment.captured': {
                const payment: RazorpayPaymentEntity = payload.payload.payment.entity;
                const existing = await getPaymentByOrderId(payment.order_id);
                if (existing && ['captured', 'refunded', 'partially_refunded'].includes(existing.Payment_Status)) break;

                await markAuthorizedOrCaptured({
                    razorpayOrderId: payment.order_id,
                    razorpayPaymentId: payment.id,
                    status: 'captured',
                    paymentMethod: payment.method,
                    gatewayFee: payment.fee,
                    gatewayFeeTax: payment.tax,
                    paidAt: new Date(),
                });
                break;
            }

            case 'payment.failed': {
                const payment: RazorpayPaymentEntity = payload.payload.payment.entity;
                await markFailed({
                    razorpayOrderId: payment.order_id,
                    razorpayPaymentId: payment.id,
                    errorCode: payment.error_code,
                    errorDescription: payment.error_description,
                    errorSource: payment.error_source,
                    errorStep: payment.error_step,
                    errorReason: payment.error_reason,
                });
                break;
            }

            case 'refund.created':
            case 'refund.processed': {
                const refund: RazorpayRefundEntity = payload.payload.refund.entity;
                const payment: RazorpayPaymentEntity | undefined = payload.payload.payment?.entity;
                const gross = payment ? Number((payment as any).amount ?? 0) : 0;
                const status = gross && refund.amount >= gross ? 'refunded' : 'partially_refunded';

                await markRefunded({
                    razorpayPaymentId: refund.payment_id,
                    amountRefunded: refund.amount,
                    status,
                });
                break;
            }

            default:
                console.log('Unhandled Razorpay webhook event', payload?.event);
        }
    } catch (error) {
        console.error('Razorpay webhook processing error', error);
    }

    return NextResponse.json({ success: true, message: 'Webhook received successfully' });
}
