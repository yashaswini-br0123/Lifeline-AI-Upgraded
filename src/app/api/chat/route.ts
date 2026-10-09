import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { chatWithAssistant } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const payload = sessionToken ? verifySession(sessionToken) : null;
    const userId = payload?.userId || "demo-user-id-123";

    const body = await request.json();
    const { message, history } = body;

    if (!message) {
      return NextResponse.json({ error: "Message is required." }, { status: 400 });
    }

    let userContext: any = {
      name: "Patient",
      age: 24,
      bloodType: "O+",
      allergies: "Penicillin",
      chronicConditions: "Mild Asthma",
      activeMedications: [{ name: "Paracetamol", dosage: "500mg", schedule: "As needed" }],
      recentRecords: [],
    };

    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          name: true,
          age: true,
          bloodType: true,
          allergies: true,
          chronicConditions: true,
        },
      });

      if (user) {
        const activeMedications = await prisma.medication.findMany({
          where: { userId, active: true },
          select: { name: true, dosage: true, schedule: true },
        });

        const recentRecords = await prisma.medicalRecord.findMany({
          where: { userId },
          orderBy: { uploadedAt: "desc" },
          take: 5,
          select: { fileName: true, category: true, aiSummary: true },
        });

        userContext = {
          name: user.name,
          age: user.age,
          bloodType: user.bloodType,
          allergies: user.allergies,
          chronicConditions: user.chronicConditions,
          activeMedications,
          recentRecords,
        };
      }
    } catch (dbError) {
      console.warn("DB lookup error in chat route, falling back to demo user context");
    }

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
