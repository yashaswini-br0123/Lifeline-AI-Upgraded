import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { getDrugProfile } from "@/lib/gemini";

export async function GET(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    if (!sessionToken) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payload = verifySession(sessionToken);
    if (!payload) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

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
