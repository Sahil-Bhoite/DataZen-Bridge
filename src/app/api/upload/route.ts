import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

/**
 * POST /api/upload
 * Accepts: multipart/form-data with a file field.
 * Saves the uploaded file to the "uploads" directory.
 */
export async function POST(request: Request) {
  try {
    // Parse the multipart form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded." }, { status: 400 });
    }

    // Read file content as ArrayBuffer and convert to Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    await fs.mkdir(uploadsDir, { recursive: true });

    // Save the file
    const filePath = path.join(uploadsDir, file.name);
    await fs.writeFile(filePath, buffer);

    return NextResponse.json({ message: "File uploaded successfully.", fileName: `uploads/${file.name}` });
  } catch (error: unknown) {
    function hasMessage(e: unknown): e is { message: string } {
      return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
    }
    let message = "Unknown error";
    if (hasMessage(error)) {
      message = error.message;
    }
    return NextResponse.json({ error: "File upload failed: " + message }, { status: 500 });
  }
}
