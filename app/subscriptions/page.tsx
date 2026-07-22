'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { Button, Card } from '@/components/ui/primitives';
import { PLANS, SubscriptionPlan, CURRENCIES, CurrencyCode } from '@/lib/subscriptionPlans';

const PricingCard = ({ plan, currency }: { plan: SubscriptionPlan; currency: CurrencyCode }) => {
    const [loading, setLoading] = useState(false);

    const price = plan.prices[currency];
    const isCustom = price === null;

    const handleSubscribe = async () => {
        console.log("D1")
        setLoading(true);

        try {
            const res = await fetch('/api/razorpay/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id, currency }),
            });
            const body = await res.json();

            if (!body.success) {
                console.error('Order creation failed', body);
                alert(body.message ?? 'Could not start checkout');
                setLoading(false);
                return;
            }

            const { orderId, amount, currency: orderCurrency, keyId, planName } = body.data;

            const options = {
                key: keyId,
                amount,
                currency: orderCurrency,
                order_id: orderId,

                name: 'Axilrate',
                image: 'https://axilrate.com/brand/axilrate-logo-cropped.png',
                description: `${planName} Plan Subscription`,

                handler: async function (response: any) {
                    console.log('Subscription payment handler', { response });

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
                        alert(`Subscribed to ${planName}! Payment ID: ${response.razorpay_payment_id}`);
                    } else {
                        alert('Payment verification failed');
                    }

                    setLoading(false);
                },
                modal: {
                    ondismiss: function () {
                        console.log('Subscription checkout dismissed by user', { planId: plan.id });
                        setLoading(false);
                    },
                },
                theme: {
                    color: '#25d366',
                    backdrop_color: '#ffffff',
                },
            };

            const razorpay = new (window as any).Razorpay(options);

            razorpay.on('payment.failed', async function (response: any) {
                console.log('Subscription payment failed', { response });

                await fetch('/api/razorpay/failed', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ error: response.error }),
                });

                alert(response.error.description);
                setLoading(false);
            });

            razorpay.open();
        } catch (err) {
            console.error('Subscribe flow error', err);
            alert('Something went wrong, please try again');
            setLoading(false);
        }
    };

    return (
        <Card
            className={`flex flex-col p-6 transition-transform hover:-translate-y-1 hover:shadow-panel ${
                plan.mostPopular ? 'border-wa-green ring-1 ring-wa-green' : ''
            }`}
        >
            {plan.mostPopular && (
                <span className="mb-3 inline-block w-fit rounded-full bg-wa-green px-3 py-1 text-xs font-semibold text-wa-ink">
                    Most Popular
                </span>
            )}

            <h3 className="text-lg font-semibold text-slate-100">{plan.name}</h3>
            <p className="mt-1 text-sm text-slate-400">{plan.description}</p>

            <div className="mt-4 flex items-baseline gap-1">
                {isCustom ? (
                    <span className="text-3xl font-bold text-slate-100">Custom</span>
                ) : (
                    <>
                        <span className="text-3xl font-bold text-slate-100">
                            {CURRENCIES[currency].symbol}
                            {price!.toLocaleString(currency === 'INR' ? 'en-IN' : 'en-US')}
                        </span>
                        <span className="text-sm text-slate-400">/mo</span>
                    </>
                )}
            </div>

            <ul className="mt-6 flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-slate-300">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-wa-green" />
                        {feature}
                    </li>
                ))}
            </ul>

            <Button
                variant="primary"
                className="mt-6 w-full justify-center py-2.5"
                disabled={loading || isCustom}
                onClick={handleSubscribe}
            >
                {isCustom ? 'Contact Sales' : loading ? 'Processing...' : 'Subscribe'}
            </Button>
        </Card>
    );
};

export default function Subscriptions() {
    const [currency, setCurrency] = useState<CurrencyCode>('INR');

    return (
        <main className="min-h-screen px-6 py-16">
            <div className="mx-auto max-w-6xl">
                <div className="mb-10 text-center">
                    <h1 className="text-3xl font-bold text-slate-100">Subscription Plans</h1>
                    <p className="mt-2 text-slate-400">Choose the plan that fits your business.</p>

                    <select
                        value={currency}
                        onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
                        className="mt-4 rounded border px-3 py-2"
                    >
                        {Object.entries(CURRENCIES).map(([code, { label }]) => (
                            <option key={code} value={code}>
                                {label} ({code})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
                    {PLANS.map((plan) => (
                        <PricingCard key={plan.id} plan={plan} currency={currency} />
                    ))}
                </div>
            </div>
        </main>
    );
}
