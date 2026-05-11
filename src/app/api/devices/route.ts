import { NextRequest, NextResponse } from "next/server";
import { squareClient, LOCATION_ID } from "@/lib/square";
import { v4 as uuidv4 } from "uuid";

export async function GET() {
  try {
    const response = await (squareClient.devicesApi as any).listDevices();
    const devices = (response.result.devices || []).map((d: any) => ({
      id: d.id,
      name: d.name || d.components?.[0]?.type || "Square Device",
      status: d.status,
      locationId: d.locationId,
      productType: d.productType || d.product || "TERMINAL",
    }));

    return NextResponse.json({ devices });
  } catch (error: any) {
    console.error("List devices error:", error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.detail || error?.message || "Failed to list devices" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create-device-code") {
      const response = await (squareClient.terminalApi as any).createDeviceCode({
        idempotencyKey: uuidv4(),
        deviceCode: {
          productType: "TERMINAL_API",
          locationId: LOCATION_ID,
          name: body.name || "MSA Kiosk Reader",
        },
      });

      const deviceCode = response.result.deviceCode;
      return NextResponse.json({
        success: true,
        deviceCode: {
          id: deviceCode?.id,
          code: deviceCode?.code,
          status: deviceCode?.status,
          locationId: deviceCode?.locationId,
          pairBy: deviceCode?.pairBy,
        },
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error: any) {
    console.error("Device action error:", error);
    return NextResponse.json(
      { error: error?.errors?.[0]?.detail || error?.message || "Device action failed" },
      { status: 500 }
    );
  }
}
