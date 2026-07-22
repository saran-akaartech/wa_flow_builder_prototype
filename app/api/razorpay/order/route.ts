import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';
import { getPlanById, CurrencyCode } from '@/lib/subscriptionPlans';
import { createPaymentRecord, PLACEHOLDER_CLIENT_ID } from '@/lib/payments';

const SUPPORTED_CURRENCIES: CurrencyCode[] = ['INR', 'USD', 'EUR'];

export async function POST(request: Request) {
    const body = await request.json();
    const planId = body.planId;
    const currency: CurrencyCode = body.currency ?? 'INR';

    console.log('Subscription order request', { planId, currency });

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return NextResponse.json(
            { success: false, message: 'Unsupported currency' },
            { status: 400 }
        );
    }

    const plan = getPlanById(planId);
    const price = plan?.prices[currency];

    if (!plan || price === null || price === undefined) {
        return NextResponse.json(
            { success: false, message: 'Invalid plan' },
            { status: 400 }
        );
    }

    const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    try {
        const order = await razorpay.orders.create({
            amount: price * 100,
            currency,
            receipt: `sub_${plan.id}_${Date.now()}`,
            notes: { planId: plan.id },
        });

        console.log('Subscription order created', { orderId: order.id, amount: order.amount, planId: plan.id });

        try {
            const gross = Number(order.amount);
            await createPaymentRecord({
                clientId: PLACEHOLDER_CLIENT_ID,
                razorpayOrderId: order.id,
                amount: Math.round(gross / 1.18),
                gross,
                currency: order.currency,
                description: `Subscription: ${plan.name}`,
                notes: { planId: plan.id },
                receiptNo: order.receipt ?? undefined,
            });
        } catch (dbErr) {
            console.error('Failed to persist Client_Payments record for order', { orderId: order.id, dbErr });
        }

        return NextResponse.json({
            success: true,
            data: {
                orderId: order.id,
                amount: order.amount,
                currency: order.currency,
                keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                planId: plan.id,
                planName: plan.name,
            },
        });
    } catch (err) {
        console.error('Subscription order creation failed', { planId: plan.id, err });
        return NextResponse.json(
            { success: false, message: 'Order creation failed' },
            { status: 500 }
        );
    }
}
