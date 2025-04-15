import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";

// This endpoint implements dynamic schema discovery for a Flat File.
// It reads a specified file from disk, parses the first line (header) using the provided delimiter,
// and returns the list of column names.
//
// Query Parameters:
// - file: The path to the flat file (relative to the project root).
// - delimiter: The delimiter used in the flat file (e.g., ',' or ';'). Default is comma.

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const filePathParam = searchParams.get("file");
    const delimiter = searchParams.get("delimiter") || ",";
    
    if (!filePathParam) {
      return NextResponse.json({ error: "File parameter is required." }, { status: 400 });
    }
    
    // Resolve the file path relative to the current working directory.
    const filePath = path.join(process.cwd(), filePathParam);
    
    // Read the file content.
    const fileContent = await fs.readFile(filePath, "utf8");
    
    // Get the first line (header) and split by the delimiter to get columns.
    const headerLine = fileContent.split("\n")[0];
    const columns = headerLine.split(delimiter).map(col => col.trim());
    
    return NextResponse.json({ columns });
  } catch (error: unknown) {
    function hasMessage(e: unknown): e is { message: string } {
      return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
    }
    let message = "Unknown error";
    if (hasMessage(error)) {
      message = error.message;
    }
    return NextResponse.json({ error: "Failed to fetch flat file columns: " + message }, { status: 500 });
  }
}
