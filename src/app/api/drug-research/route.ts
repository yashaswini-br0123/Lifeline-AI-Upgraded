import { NextResponse } from "next/server";
import { getDrugProfile } from "@/lib/gemini";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const drugName = url.searchParams.get("name");

    if (!drugName || !drugName.trim()) {
      return NextResponse.json({ error: "Drug name is required." }, { status: 400 });
    }

    const profile = await getDrugProfile(drugName);
    return NextResponse.json({ success: true, profile });
  } catch (error: any) {
    console.error("Drug research API error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
