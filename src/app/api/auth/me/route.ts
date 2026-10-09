import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession, signSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const DEMO_USER = {
  id: "demo-user-id-123",
  email: "patient@lifeline.ai",
  name: "Patient",
  age: 24,
  bloodType: "O+",
  allergies: "Penicillin",
  chronicConditions: "Mild Asthma",
  emergencyContactName: "Emergency Contact",
  emergencyContactPhone: "+91 98765 43210",
  createdAt: new Date().toISOString(),
};

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;

    if (!sessionToken) {
      const demoToken = signSession({
        userId: DEMO_USER.id,
        email: DEMO_USER.email,
        name: DEMO_USER.name,
      });
      cookieStore.set("session", demoToken, {
        httpOnly: true,
        path: "/",
        maxAge: 7 * 24 * 60 * 60,
      });
      return NextResponse.json({ user: DEMO_USER });
    }

    const payload = verifySession(sessionToken);
    if (!payload) {
      return NextResponse.json({ user: DEMO_USER });
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
      return NextResponse.json({ user: DEMO_USER });
    }

    return NextResponse.json({ user });
  } catch (error) {
    console.error("Auth me error, using demo fallback:", error);
    return NextResponse.json({ user: DEMO_USER });
  }
}

export async function PUT(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session")?.value;
    const payload = sessionToken ? verifySession(sessionToken) : null;
    const userId = payload ? payload.userId : DEMO_USER.id;

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

    try {
      const updatedUser = await prisma.user.update({
        where: { id: userId },
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
    } catch {
      // Fallback demo update
      const updatedDemo = {
        ...DEMO_USER,
        name: name || DEMO_USER.name,
        age: age ? parseInt(age, 10) : DEMO_USER.age,
        bloodType: bloodType || DEMO_USER.bloodType,
        allergies: allergies || DEMO_USER.allergies,
        chronicConditions: chronicConditions || DEMO_USER.chronicConditions,
        emergencyContactName: emergencyContactName || DEMO_USER.emergencyContactName,
        emergencyContactPhone: emergencyContactPhone || DEMO_USER.emergencyContactPhone,
      };
      return NextResponse.json({ user: updatedDemo });
    }
  } catch (error) {
    console.error("Update profile error:", error);
    return NextResponse.json({ user: DEMO_USER });
  }
}
