import { NextRequest, NextResponse } from "next/server";
import { terminalApi, LOCATION_ID } from "@/lib/square";
import { v4 as uuidv4 } from "uuid";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { amountCents, deviceId } = body;

    if (!amountCents || !deviceId) {
      return NextResponse.json(
        { error: "Missing required fields: amountCents, deviceId" },
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

    const response = await terminalApi.createTerminalCheckout({
      idempotencyKey,
      checkout: {
        amountMoney: {
          amount: BigInt(amountCents),
          currency: "USD",
        },
        deviceOptions: {
          deviceId,
          skipReceiptScreen: true,
          collectSignature: false,
        },
        referenceId: `msa-kiosk-${Date.now()}`,
        note: `MSA Payment - $${(amountCents / 100).toFixed(2)}`,
        paymentOptions: {
          autocomplete: true,
        },
      },
    });

    const checkout = response.result.checkout;

    return NextResponse.json({
      success: true,
      checkout: {
        id: checkout?.id,
        status: checkout?.status,
        amount: checkout?.amountMoney?.amount?.toString(),
        deviceId: checkout?.deviceOptions?.deviceId,
        createdAt: checkout?.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Terminal checkout error:", error);

    const errorMessage =
      error?.errors?.[0]?.detail ||
      error?.message ||
      "Failed to create terminal checkout";

    return NextResponse.json(
      { error: errorMessage },
      { status: error?.statusCode || 500 }
    );
  }
}
