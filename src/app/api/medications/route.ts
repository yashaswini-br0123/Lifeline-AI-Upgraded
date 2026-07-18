import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkMedicationConflict } from "@/lib/gemini";

export async function GET() {
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

    const medications = await prisma.medication.findMany({
      where: { userId: payload.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ medications });
  } catch (error) {
    console.error("Fetch medications error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

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
    const { name, dosage, schedule, instructions, endDate } = body;

    if (!name || !dosage || !schedule) {
      return NextResponse.json(
        { error: "Name, dosage, and schedule are required." },
        { status: 400 }
      );
    }

    // Fetch user details for allergy/chronic conditions checks
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: { allergies: true, chronicConditions: true },
    });

    // Fetch active medications to check interactions
    const activeMeds = await prisma.medication.findMany({
      where: { userId: payload.userId, active: true },
      select: { name: true, dosage: true },
    });

    // Run conflict checker
    const conflictResult = await checkMedicationConflict(
      name,
      dosage,
      activeMeds,
      user?.allergies || null,
      user?.chronicConditions || null
    );

    const medication = await prisma.medication.create({
      data: {
        userId: payload.userId,
        name,
        dosage,
        schedule,
        instructions: instructions || null,
        endDate: endDate ? new Date(endDate) : null,
        active: true,
        flaggedConflicts: conflictResult,
      },
    });

    return NextResponse.json({ success: true, medication });
  } catch (error: any) {
    console.error("Add medication error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
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
    const { id, active, name, dosage, schedule, instructions, endDate } = body;

    if (!id) {
      return NextResponse.json({ error: "Medication ID is required." }, { status: 400 });
    }

    const existingMed = await prisma.medication.findUnique({
      where: { id },
    });

    if (!existingMed || existingMed.userId !== payload.userId) {
      return NextResponse.json({ error: "Medication not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (active !== undefined) updateData.active = active;
    if (name !== undefined) updateData.name = name;
    if (dosage !== undefined) updateData.dosage = dosage;
    if (schedule !== undefined) updateData.schedule = schedule;
    if (instructions !== undefined) updateData.instructions = instructions;
    if (endDate !== undefined) updateData.endDate = endDate ? new Date(endDate) : null;

    // Recheck conflicts if reactivation or name/dosage change occurs
    if (
      (active === true && existingMed.active === false) ||
      (name && name !== existingMed.name) ||
      (dosage && dosage !== existingMed.dosage)
    ) {
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        select: { allergies: true, chronicConditions: true },
      });

      const otherActiveMeds = await prisma.medication.findMany({
        where: {
          userId: payload.userId,
          active: true,
          id: { not: id },
        },
        select: { name: true, dosage: true },
      });

      const conflictResult = await checkMedicationConflict(
        name || existingMed.name,
        dosage || existingMed.dosage,
        otherActiveMeds,
        user?.allergies || null,
        user?.chronicConditions || null
      );

      updateData.flaggedConflicts = conflictResult;
    }

    const updatedMed = await prisma.medication.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, medication: updatedMed });
  } catch (error: any) {
    console.error("Update medication error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
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
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Medication ID is required." }, { status: 400 });
    }

    const med = await prisma.medication.findUnique({
      where: { id },
    });

    if (!med || med.userId !== payload.userId) {
      return NextResponse.json({ error: "Medication not found." }, { status: 404 });
    }

    await prisma.medication.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete medication error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
