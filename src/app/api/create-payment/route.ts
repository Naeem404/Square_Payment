import { NextRequest, NextResponse } from "next/server";
import { paymentsApi, LOCATION_ID } from "@/lib/square";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sourceId, amountCents, note } = body;

    if (!sourceId || !amountCents) {
      return NextResponse.json(
        { error: "Missing required fields: sourceId, amountCents" },
        { status: 400 }
      );
    }

    if (![500, 1000].includes(amountCents)) {
      return NextResponse.json(
        { error: "Invalid amount. Only $5.00 and $10.00 are accepted." },
        { status: 400 }
      );
    }

    const idempotencyKey = uuidv4();

    const response = await paymentsApi.createPayment({
      sourceId,
      idempotencyKey,
      amountMoney: {
        amount: BigInt(amountCents),
        currency: "USD",
      },
      locationId: LOCATION_ID,
      note: note || `MSA Kiosk Payment - $${(amountCents / 100).toFixed(2)}`,
      autocomplete: true,
    });

    const payment = response.result.payment;

    return NextResponse.json({
      success: true,
      payment: {
        id: payment?.id,
        status: payment?.status,
        amount: payment?.amountMoney?.amount?.toString(),
        currency: payment?.amountMoney?.currency,
        receiptUrl: payment?.receiptUrl,
        createdAt: payment?.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Payment error:", error);

    const errorMessage =
      error?.errors?.[0]?.detail ||
      error?.message ||
      "Payment processing failed";

    return NextResponse.json(
      { error: errorMessage },
      { status: error?.statusCode || 500 }
    );
  }
}
