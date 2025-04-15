import { NextResponse } from "next/server";
import { fetchTables } from "@/services/clickhouse";
import { parseCSVFile } from "@/services/flatFile";

/**
 * POST /api/clickhouse/tables
 * Body: { host, port, database, user, jwt }
 * Returns: { tables: string[] } or { error }
 */
export async function POST(request: Request) {
  try {
    const { host, port, database, user, jwt } = await request.json();

    if (!host || !port || !database || !user || !jwt) {
      return NextResponse.json({ error: "Missing ClickHouse connection parameters." }, { status: 400 });
    }

    const config = {
      host,
      port,
      database,
      user,
      jwt,
    };

    const tables = await fetchTables(config);
    return NextResponse.json({ tables });
  } catch (error: unknown) {
    function hasMessage(e: unknown): e is { message: string } {
      return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
    }
    let message = "Unknown error";
    if (hasMessage(error)) {
      message = error.message;
    }
    return NextResponse.json({ error: "Failed to fetch tables: " + message }, { status: 500 });
  }
}
