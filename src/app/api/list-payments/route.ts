import { NextRequest, NextResponse } from "next/server";
import { paymentsApi, LOCATION_ID } from "@/lib/square";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pin = searchParams.get("pin");

    if (pin !== process.env.ADMIN_PIN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const response = await paymentsApi.listPayments(
      undefined, // beginTime
      undefined, // endTime
      "DESC",    // sortOrder
      undefined, // cursor
      LOCATION_ID // locationId
    );

    const payments = (response.result.payments || []).map((p) => ({
      id: p.id,
      status: p.status,
      amount: p.amountMoney?.amount?.toString(),
      currency: p.amountMoney?.currency,
      note: p.note,
      receiptUrl: p.receiptUrl,
      createdAt: p.createdAt,
      cardBrand: p.cardDetails?.card?.cardBrand,
      last4: p.cardDetails?.card?.last4,
    }));

    const totalCents = payments
      .filter((p) => p.status === "COMPLETED")
      .reduce((sum, p) => sum + parseInt(p.amount || "0"), 0);

    return NextResponse.json({
      payments,
      summary: {
        totalPayments: payments.length,
        completedPayments: payments.filter((p) => p.status === "COMPLETED")
          .length,
        totalCollected: totalCents,
        totalCollectedFormatted: `$${(totalCents / 100).toFixed(2)}`,
      },
    });
  } catch (error: any) {
    console.error("List payments error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
