import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { getFirstAidGuidance } from "@/lib/gemini";

export async function POST(request: Request) {
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

    const body = await request.json();
    const { description } = body;

    if (!description || !description.trim()) {
      return NextResponse.json(
        { error: "Please describe the symptoms or medical situation." },
        { status: 400 }
      );
    }

    const guidance = await getFirstAidGuidance(description.trim());
    return NextResponse.json({ success: true, guidance });
  } catch (error: any) {
    console.error("First aid API error:", error);
    return NextResponse.json(
      { error: "Failed to generate first aid response. If this is an emergency, call 112 immediately." },
      { status: 500 }
    );
  }
}
