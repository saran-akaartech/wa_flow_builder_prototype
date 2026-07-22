import { query } from '@/lib/db';

// TODO: replace with the real authenticated client id once auth exists.
export const PLACEHOLDER_CLIENT_ID = 1;

export type PaymentStatus =
    | 'created'
    | 'authorized'
    | 'captured'
    | 'failed'
    | 'partially_refunded'
    | 'refunded';

export interface CreatePaymentRecordInput {
    clientId: number;
    razorpayOrderId: string;
    amount: number;
    gross: number;
    tax?: number;
    currency: string;
    description?: string;
    notes?: Record<string, unknown>;
    receiptNo?: string;
    isInternational?: boolean;
}

export async function createPaymentRecord(input: CreatePaymentRecordInput) {
    const {
        clientId,
        razorpayOrderId,
        amount,
        gross,
        tax = 18.0,
        currency,
        description,
        notes = {},
        receiptNo,
        isInternational,
    } = input;

    await query(
        `INSERT INTO public."Client_Payments"
            ("Client_Id", "Razorpay_Order_Id", "Amount", "Gross", "Tax", "Currency",
             "Description", "Notes", "Receipt_No", "Is_International")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         ON CONFLICT ("Razorpay_Order_Id") DO NOTHING`,
        [clientId, razorpayOrderId, amount, gross, tax, currency, description ?? null, JSON.stringify(notes), receiptNo ?? null, isInternational ?? null]
    );
}

export interface MarkAuthorizedOrCapturedInput {
    razorpayOrderId: string;
    razorpayPaymentId: string;
    status: 'authorized' | 'captured';
    paymentMethod?: string;
    gatewayFee?: number;
    gatewayFeeTax?: number;
    paidAt?: Date;
}

export async function markAuthorizedOrCaptured(input: MarkAuthorizedOrCapturedInput) {
    const { razorpayOrderId, razorpayPaymentId, status, paymentMethod, gatewayFee, gatewayFeeTax, paidAt } = input;

    await query(
        `UPDATE public."Client_Payments"
         SET "Payment_Status" = $1,
             "Razorpay_Payment_Id" = $2,
             "Payment_Method" = COALESCE($3, "Payment_Method"),
             "Gateway_Fee" = COALESCE($4, "Gateway_Fee"),
             "Gateway_Fee_Tax" = COALESCE($5, "Gateway_Fee_Tax"),
             "Paid_At" = COALESCE($6, "Paid_At"),
             "Updated_At" = NOW()
         WHERE "Razorpay_Order_Id" = $7`,
        [status, razorpayPaymentId, paymentMethod ?? null, gatewayFee ?? null, gatewayFeeTax ?? null, paidAt ?? null, razorpayOrderId]
    );
}

export interface MarkFailedInput {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    errorCode?: string;
    errorDescription?: string;
    errorSource?: string;
    errorStep?: string;
    errorReason?: string;
}

export async function markFailed(input: MarkFailedInput) {
    const { razorpayOrderId, razorpayPaymentId, errorCode, errorDescription, errorSource, errorStep, errorReason } = input;

    if (!razorpayOrderId) return;

    await query(
        `UPDATE public."Client_Payments"
         SET "Payment_Status" = 'failed',
             "Razorpay_Payment_Id" = COALESCE($1, "Razorpay_Payment_Id"),
             "Error_Code" = $2,
             "Error_Description" = $3,
             "Error_Source" = $4,
             "Error_Step" = $5,
             "Error_Reason" = $6,
             "Updated_At" = NOW()
         WHERE "Razorpay_Order_Id" = $7`,
        [razorpayPaymentId ?? null, errorCode ?? null, errorDescription ?? null, errorSource ?? null, errorStep ?? null, errorReason ?? null, razorpayOrderId]
    );
}

export interface MarkRefundedInput {
    razorpayPaymentId: string;
    amountRefunded: number;
    status: 'partially_refunded' | 'refunded';
}

export async function markRefunded(input: MarkRefundedInput) {
    const { razorpayPaymentId, amountRefunded, status } = input;

    await query(
        `UPDATE public."Client_Payments"
         SET "Amount_Refunded" = $1,
             "Payment_Status" = $2,
             "Updated_At" = NOW()
         WHERE "Razorpay_Payment_Id" = $3`,
        [amountRefunded, status, razorpayPaymentId]
    );
}

export async function getPaymentByOrderId(razorpayOrderId: string) {
    const result = await query<{ Payment_Status: PaymentStatus; Gross: number }>(
        `SELECT "Payment_Status", "Gross" FROM public."Client_Payments" WHERE "Razorpay_Order_Id" = $1`,
        [razorpayOrderId]
    );
    return result.rows[0];
}
