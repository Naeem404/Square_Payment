import { NextRequest, NextResponse } from "next/server";
import { terminalApi } from "@/lib/square";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get("id");

    if (!checkoutId) {
      return NextResponse.json(
        { error: "Missing checkout ID" },
        { status: 400 }
      );
    }

    const response = await terminalApi.getTerminalCheckout(checkoutId);
    const checkout = response.result.checkout;

    return NextResponse.json({
      id: checkout?.id,
      status: checkout?.status,
      paymentIds: checkout?.paymentIds,
      amount: checkout?.amountMoney?.amount?.toString(),
      cancelReason: checkout?.cancelReason,
    });
  } catch (error: any) {
    console.error("Checkout status error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to get checkout status" },
      { status: 500 }
    );
  }
}
