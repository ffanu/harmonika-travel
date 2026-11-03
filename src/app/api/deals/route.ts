import { NextResponse } from "next/server";
import { cheapestDeals, affiliateMarker, unavailableResponse } from "@/lib/travelpayouts";

/**
 * Titik pemeriksaan harga mitra. Berguna untuk memantau integrasi tanpa
 * membuka halaman; token tetap berada di server.
 */
export const revalidate = 900;

export async function GET() {
  try {
    const { deals, error } = await cheapestDeals();
    if (error) {
      return NextResponse.json(
        { ok: false, reason: error, marker: affiliateMarker || null, deals: [] },
        { status: 503 },
      );
    }
    return NextResponse.json({ ok: true, marker: affiliateMarker, count: deals.length, deals });
  } catch (error) {
    return unavailableResponse(error);
  }
}
