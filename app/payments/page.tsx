'use client';

import { useState } from 'react';

const CURRENCIES = {
    INR: { label: 'Rupees', symbol: '₹', amount: 500 },
    USD: { label: 'Dollars', symbol: '$', amount: 5 },
    EUR: { label: 'Euros', symbol: '€', amount: 5 },
} as const;

type CurrencyCode = keyof typeof CURRENCIES;

const PaymentButton = () => {
    const [loading, setLoading] = useState(false);
    const [currency, setCurrency] = useState<CurrencyCode>('INR');

    const handlePayment = async () => {
        setLoading(true);

        const res = await fetch('/api/razorpay', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ amount: CURRENCIES[currency].amount, currency }),
        });

        const order = await res.json();

        const options = {
            key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,

            amount: order.amount,
            currency: order.currency,
            order_id: order.id,

            name: 'Axilrate',
            image: "https://axilrate.com/brand/axilrate-logo-cropped.png",
            //  description: "Product Purchase Description",

            handler: async function (response: any) {
                console.log("Payment Handler ", { response })

                const verifyRes = await fetch('/api/razorpay/verify', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        razorpay_order_id: response.razorpay_order_id,
                        razorpay_payment_id: response.razorpay_payment_id,
                        razorpay_signature: response.razorpay_signature,
                    }),
                });
                const verifyData = await verifyRes.json();

                if (verifyData.success) {
                    alert('Payment Successful: ' + response.razorpay_payment_id);
                } else {
                    alert('Payment verification failed');
                }
            },
            modal: {
                ondismiss: function () {
                    console.log("Checkout modal dismissed by user");
                }
            },
            // prefill: {
            //     name: 'Saran',
            //     email: 'saranaadithyan@akaartech.com',
            //     contact: '8428802056',
            // },
            theme: {
                color: "#3399cc",                           // Hex color overriding buttons and accents
                backdrop_color: "#ffffff"                  // Hex backdrop background setting
            },
        };

        const razorpay = new (window as any).Razorpay(options);

        razorpay.on('payment.failed', async function (response: any) {
            console.log("Payment Failed : ", { response })

            await fetch('/api/razorpay/failed', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ error: response.error }),
            });

            // alert(response.error.code);
            alert(response.error.description);
            // alert(response.error.source);
            // alert(response.error.step);
            // alert(response.error.reason);
            // alert(response.error.metadata.order_id);
            // alert(response.error.metadata.payment_id);
        });


        razorpay.open();



        setLoading(false);
    };

    return (
        <div className="flex flex-col items-center gap-4">
            <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                className="border rounded px-3 py-2"
            >
                {Object.entries(CURRENCIES).map(([code, { label }]) => (
                    <option key={code} value={code}>
                        {label} ({code})
                    </option>
                ))}
            </select>
            <button
                onClick={handlePayment}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
                {loading
                    ? 'Processing...'
                    : `Pay ${CURRENCIES[currency].symbol}${CURRENCIES[currency].amount}`}
            </button>
        </div>
    );
};



export default function Payments() {
    return (
        <main className="flex items-center justify-center min-h-screen">
            <PaymentButton />
        </main>
    );
}