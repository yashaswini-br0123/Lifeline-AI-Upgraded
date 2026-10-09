import { NextResponse } from "next/server";
import { getFirstAidGuidance } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
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
