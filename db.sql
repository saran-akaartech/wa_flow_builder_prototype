

CREATE TABLE public."Client_Payments" (
    "Client_Id"             INTEGER NOT NULL,

    "Razorpay_Order_Id"     VARCHAR(100) NOT NULL UNIQUE,
    "Razorpay_Payment_Id"   VARCHAR(100) UNIQUE,
    "Razorpay_Invoice_Id"   VARCHAR(100),

    "Amount"                BIGINT NOT NULL,      -- Amount before tax (paise)
    "Gross"                 BIGINT NOT NULL,      -- Amount charged including tax (paise)
    "Tax"                   NUMERIC(5,2) NOT NULL DEFAULT 18.00,
    "Currency"              VARCHAR(10) NOT NULL DEFAULT 'INR',
   
    "Amount_Refunded"       BIGINT NOT NULL DEFAULT 0,

    "Payment_Status"        VARCHAR(30) NOT NULL DEFAULT 'created'
        CHECK (
            "Payment_Status" IN (
                'created',
                'authorized',
                'captured',
                'failed',
                'partially_refunded',
                'refunded'
            )
        ),

    "Payment_Method"        VARCHAR(30),
    "Gateway_Fee"           BIGINT,                        -- Razorpay's fee, paise
    "Gateway_Fee_Tax"       BIGINT,                        -- GST on that fee (your input credit)
    
    "Description"           TEXT,
    "Notes"                 JSONB DEFAULT '{}',

    "Receipt_No"            VARCHAR(100),

    "Paid_At"               TIMESTAMPTZ,

    "Metadata"              JSONB DEFAULT '{}',

    "Created_At"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "Updated_At"            TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    "Is_International"      Boolean,

    "Error_Code"            VARCHAR(100),
    "Error_Description"     TEXT,
    "Error_Source"          VARCHAR(50),
    "Error_Step"            VARCHAR(50),
    "Error_Reason"          VARCHAR(100),

    "Webhook_Event_Id" VARCHAR(100)
);

Alter table "Client_Payments"
drop column "Webhook_Event_Id";


select * from  public."Client_Payments" where "Razorpay_Payment_Id"='';