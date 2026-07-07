import { NextRequest, NextResponse } from "next/server";
import { createFlow } from "@/lib/flowService";

export async function POST(req: NextRequest) {

    try {

        const body = await req.json();

        const response = await createFlow(body);

       

        return NextResponse.json({
            success: true,
            data: response,
        });

    } catch (error: any) {

        return NextResponse.json(
            {
                success: false,
                message: error.message,
            },
            { status: 500 }
        );
    }
}