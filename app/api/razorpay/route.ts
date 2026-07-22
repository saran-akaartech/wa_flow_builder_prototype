import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

const SUPPORTED_CURRENCIES = ['INR', 'USD', 'EUR'];

export async function POST(request: Request) {
    const body = await request.json();
    const amount = body.amount;
    const currency = body.currency ?? 'INR';

    if (!SUPPORTED_CURRENCIES.includes(currency)) {
        return NextResponse.json({ error: 'Unsupported currency' }, { status: 400 });
    }

    const razorpay = new Razorpay({
        key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        key_secret: process.env.RAZORPAY_KEY_SECRET!,
    });

    const options = {
        amount: amount * 100, // amount in minor currency unit (paise/cents)
        currency,
        receipt: 'receipt_order_' + Date.now(),
    };

    try {
        const order = await razorpay.orders.create(options);
        console.log({order})
        return NextResponse.json(order);
    } catch (err) {
        return NextResponse.json({ error: 'Order creation failed' }, { status: 500 });
    }
}