import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        bloodType: true,
        allergies: true,
        chronicConditions: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
        createdAt: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error:", error);
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
    const {
      name,
      age,
      bloodType,
      allergies,
      chronicConditions,
      emergencyContactName,
      emergencyContactPhone,
    } = body;

    const parsedAge = age ? parseInt(age, 10) : null;

    const updatedUser = await prisma.user.update({
      where: { id: payload.userId },
      data: {
        name: name !== undefined ? name.trim() : undefined,
        age: age !== undefined ? (isNaN(parsedAge as number) ? null : parsedAge) : undefined,
        bloodType: bloodType !== undefined ? bloodType : undefined,
        allergies: allergies !== undefined ? allergies : undefined,
        chronicConditions: chronicConditions !== undefined ? chronicConditions : undefined,
        emergencyContactName: emergencyContactName !== undefined ? emergencyContactName : undefined,
        emergencyContactPhone: emergencyContactPhone !== undefined ? emergencyContactPhone : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
        age: true,
        bloodType: true,
        allergies: true,
        chronicConditions: true,
        emergencyContactName: true,
        emergencyContactPhone: true,
      },
    });

    return NextResponse.json({ user: updatedUser });
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
