import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { analyzeMedicalDocument } from "@/lib/gemini";

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

    const records = await prisma.medicalRecord.findMany({
      where: { userId: payload.userId },
      orderBy: { uploadedAt: "desc" },
    });

    return NextResponse.json({ records });
  } catch (error) {
    console.error("Fetch records error:", error);
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
    const { fileName, fileType, fileUrl, extractedText, category } = body;

    if (!fileName || !fileType) {
      return NextResponse.json(
        { error: "fileName and fileType are required." },
        { status: 400 }
      );
    }

    let aiSummary = "No summary generated.";
    let finalCategory = category || "Other";

    if (extractedText) {
      const analysis = await analyzeMedicalDocument(extractedText, finalCategory);
      aiSummary = analysis.summary;
      finalCategory = analysis.category;
    }

    const record = await prisma.medicalRecord.create({
      data: {
        userId: payload.userId,
        fileName,
        fileType,
        fileUrl: fileUrl || null,
        extractedText: extractedText || null,
        aiSummary,
        category: finalCategory,
      },
    });

    return NextResponse.json({ success: true, record });
  } catch (error: any) {
    console.error("Create record error:", error);
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
      return NextResponse.json({ error: "Record ID is required." }, { status: 400 });
    }

    const record = await prisma.medicalRecord.findUnique({
      where: { id },
    });

    if (!record || record.userId !== payload.userId) {
      return NextResponse.json({ error: "Record not found." }, { status: 404 });
    }

    await prisma.medicalRecord.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Delete record error:", error);
    return NextResponse.json({ error: "Internal server error." }, { status: 500 });
  }
}
