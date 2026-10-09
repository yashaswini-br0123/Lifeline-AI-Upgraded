import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const payload = sessionToken ? verifySession(sessionToken) : null;
    const userId = payload?.userId || "demo-user-id-123";

    try {
      const appointments = await prisma.appointment.findMany({
        where: { userId },
        orderBy: { dateTime: "asc" },
      });
      return NextResponse.json({ appointments });
    } catch {
      return NextResponse.json({ appointments: [] });
    }
  } catch (error) {
    return NextResponse.json({ appointments: [] });
  }
}
  } catch (error) {
    console.error("Fetch appointments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const payload = sessionToken ? verifySession(sessionToken) : null;
    const userId = payload?.userId || "demo-user-id-123";

    const body = await request.json();
    const { doctorName, specialty, dateTime, notes } = body;

    if (!doctorName || !specialty || !dateTime) {
      return NextResponse.json(
        { error: "Doctor name, specialty, and date/time are required." },
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        userId: payload.userId,
        doctorName,
        specialty,
        dateTime: new Date(dateTime),
        notes: notes || null,
        status: "Scheduled",
      },
    });

    return NextResponse.json({ success: true, appointment });
  } catch (error: any) {
    console.error("Schedule appointment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const payload = sessionToken ? verifySession(sessionToken) : null;
    const userId = payload?.userId || "demo-user-id-123";

    const body = await request.json();
    const { id, doctorName, specialty, dateTime, notes, status } = body;

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required." }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.userId !== payload.userId) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    const updateData: any = {};
    if (doctorName !== undefined) updateData.doctorName = doctorName;
    if (specialty !== undefined) updateData.specialty = specialty;
    if (dateTime !== undefined) updateData.dateTime = new Date(dateTime);
    if (notes !== undefined) updateData.notes = notes;
    if (status !== undefined) updateData.status = status;

    const updated = await prisma.appointment.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({ success: true, appointment: updated });
  } catch (error: any) {
    console.error("Update appointment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const payload = sessionToken ? verifySession(sessionToken) : null;
    const userId = payload?.userId || "demo-user-id-123";

    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Appointment ID is required." }, { status: 400 });
    }

    const appointment = await prisma.appointment.findUnique({
      where: { id },
    });

    if (!appointment || appointment.userId !== payload.userId) {
      return NextResponse.json({ error: "Appointment not found." }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete appointment error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
