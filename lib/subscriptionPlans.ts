export type PlanId = 'starter' | 'growth' | 'professional' | 'enterprise';

export type CurrencyCode = 'INR' | 'USD' | 'EUR';

export const CURRENCIES: Record<CurrencyCode, { label: string; symbol: string }> = {
  INR: { label: 'Rupees', symbol: '₹' },
  USD: { label: 'Dollars', symbol: '$' },
  EUR: { label: 'Euros', symbol: '€' },
};

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  description: string;
  prices: Record<CurrencyCode, number | null>; // null = custom pricing, no fixed checkout amount
  billingCycle: 'monthly';
  features: string[];
  mostPopular?: boolean;
}

export const PLANS: SubscriptionPlan[] = [
  {
    id: 'starter',
    name: 'Starter',
    description: 'Suitable for small businesses.',
    prices: { INR: 999, USD: 12, EUR: 11 },
    billingCycle: 'monthly',
    features: [
      '1 WhatsApp Number',
      '5,000 messages/month',
      'Email Campaigns',
      'Basic Analytics',
      'Community Support',
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    description: 'Suitable for growing businesses.',
    prices: { INR: 2999, USD: 36, EUR: 33 },
    billingCycle: 'monthly',
    features: [
      '3 WhatsApp Numbers',
      '25,000 messages/month',
      'Email + WhatsApp',
      'Advanced Analytics',
      'Shared Team Access',
      'Priority Support',
    ],
    mostPopular: true,
  },
  {
    id: 'professional',
    name: 'Professional',
    description: 'Suitable for medium businesses.',
    prices: { INR: 7999, USD: 96, EUR: 88 },
    billingCycle: 'monthly',
    features: [
      '10 WhatsApp Numbers',
      '100,000 messages/month',
      'Campaign Automation',
      'Customer Segmentation',
      'API Access',
      'Custom Branding',
      'Dedicated Support',
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    description: 'Suitable for large organizations.',
    prices: { INR: null, USD: null, EUR: null },
    billingCycle: 'monthly',
    features: [
      'Unlimited Numbers',
      'Unlimited Messaging',
      'Dedicated Infrastructure',
      'Custom Integrations',
      'SLA',
      'Account Manager',
      'Enterprise Support',
    ],
  },
];

export function getPlanById(id: string): SubscriptionPlan | undefined {
  return PLANS.find((plan) => plan.id === id);
}
