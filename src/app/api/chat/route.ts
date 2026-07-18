import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithAssistant } from "@/lib/gemini";

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
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    // Fetch user profile data
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        name: true,
        age: true,
        bloodType: true,
        allergies: true,
        chronicConditions: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    // Fetch active medications
    const activeMedications = await prisma.medication.findMany({
      where: { userId: payload.userId, active: true },
      select: { name: true, dosage: true, schedule: true },
    });

    // Fetch recent medical records for context
    const recentRecords = await prisma.medicalRecord.findMany({
      where: { userId: payload.userId },
      orderBy: { uploadedAt: "desc" },
      take: 5,
      select: { fileName: true, category: true, aiSummary: true },
    });

    const userContext = {
      name: user.name,
      age: user.age,
      bloodType: user.bloodType,
      allergies: user.allergies,
      chronicConditions: user.chronicConditions,
      activeMedications,
      recentRecords,
    };

    // Consult Gemini
    const reply = await chatWithAssistant(message, history || [], userContext);

    return NextResponse.json({ reply });
  } catch (error: any) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Internal server error during chat." },
      { status: 500 }
    );
  }
}
