import { NextResponse } from "next/server";
import path from "path";
import { getClickHouseClient, ClickHouseConfig } from "../../../services/clickhouse";
import { parseCSVFile } from "../../../services/flatFile";

/**
 * Data Preview API: Retrieves up to 100 records from ClickHouse or Flat File.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sourceType, config, selectedTables, joinCondition, selectedColumns } = body;
    let dataPreview: Record<string, unknown>[] = [];

    if (sourceType === "clickhouse") {
      // ClickHouse preview
      if (!selectedTables || selectedTables.length === 0) {
        return NextResponse.json({ error: "No table selected for preview." }, { status: 400 });
      }
      if (!selectedColumns || selectedColumns.length === 0) {
        return NextResponse.json({ error: "No columns selected for preview." }, { status: 400 });
      }
      // Build query
      let query = "";
      if (selectedTables.length > 1) {
        query = `SELECT ${selectedColumns.join(", ")} FROM ${selectedTables.join(" JOIN ")} ON ${joinCondition} LIMIT 100`;
      } else {
        query = `SELECT ${selectedColumns.join(", ")} FROM ${selectedTables[0]} LIMIT 100`;
      }
      const clickhouseConfig: ClickHouseConfig = {
        ...config,
      };
      const client = getClickHouseClient(clickhouseConfig);
      const resultSet = await client.query({ query, format: "JSONEachRow" });
      dataPreview = await resultSet.json();
    } else if (sourceType === "flatFile") {
      // Flat File preview
      if (!config.fileName) {
        return NextResponse.json({ error: "File name must be provided." }, { status: 400 });
      }
      const filePath = path.join(process.cwd(), config.fileName);
      try {
        dataPreview = await parseCSVFile({
          filePath,
          delimiter: config.delimiter,
          maxRows: 100,
        });
      } catch (err: unknown) {
        function hasMessage(e: unknown): e is { message: string } {
          return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
        }
        let message = "Unknown error";
        if (hasMessage(err)) {
          message = err.message;
        }
        return NextResponse.json({ error: "CSV preview failed: " + message }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
    }

    return NextResponse.json({ dataPreview, message: "Preview retrieval successful" });
  } catch (error: unknown) {
    function hasMessage(e: unknown): e is { message: string } {
      return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
    }
    let message = "Unknown error";
    if (hasMessage(error)) {
      message = error.message;
    }
    return NextResponse.json({ error: "Preview failed: " + message }, { status: 500 });
  }
}
