import { NextResponse } from "next/server";
import { fetchColumns } from "@/services/clickhouse";

/**
 * POST /api/clickhouse/columns
 * Body: { host, port, database, user, jwt, table }
 * Returns: { columns: string[] } or { error }
 */
export async function POST(request: Request) {
  try {
    const { host, port, database, user, jwt, table } = await request.json();

    if (!host || !port || !database || !user || !jwt || !table) {
      return NextResponse.json({ error: "Missing ClickHouse connection parameters or table." }, { status: 400 });
    }

    const config = {
      host,
      port,
      database,
      user,
      jwt,
    };

    const columns = await fetchColumns(config, table);
    return NextResponse.json({ columns });
  } catch (error: unknown) {
    function hasMessage(e: unknown): e is { message: string } {
      return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
    }
    let message = "Unknown error";
    if (hasMessage(error)) {
      message = error.message;
    }
    return NextResponse.json({ error: "Failed to fetch columns: " + message }, { status: 500 });
  }
}
