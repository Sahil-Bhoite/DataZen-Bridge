import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { getClickHouseClient, ClickHouseConfig, streamQuery } from "../../../services/clickhouse";
import { parseCSVFileStream, FlatFileOptions } from "../../../services/flatFile";
import { createWriteStream } from "fs";
import { stringify } from "csv-stringify";

/**
 * Ingestion API: Bidirectional data flow between ClickHouse and Flat File.
 * - ClickHouse → Flat File: Streams data from ClickHouse and writes to CSV.
 * - Flat File → ClickHouse: Streams CSV in batches and inserts into ClickHouse.
 */
export async function POST(request: Request) {
  try {
    const { sourceType, config, selectedTables, joinCondition, selectedColumns } = await request.json();
    let ingestedCount = 0;

    if (sourceType === "clickhouse") {
      // ClickHouse → Flat File
      if (!selectedTables || selectedTables.length === 0) {
        return NextResponse.json({ error: "No table selected for ingestion." }, { status: 400 });
      }
      if (!selectedColumns || selectedColumns.length === 0) {
        return NextResponse.json({ error: "No columns selected for ingestion." }, { status: 400 });
      }
      // Build query
      let query = "";
      if (selectedTables.length > 1) {
        query = `SELECT ${selectedColumns.join(", ")} FROM ${selectedTables.join(" JOIN ")} ON ${joinCondition}`;
      } else {
        query = `SELECT ${selectedColumns.join(", ")} FROM ${selectedTables[0]}`;
      }

      // Prepare output CSV file
      const outputDir = path.join(process.cwd(), "output");
      const outputPath = path.join(outputDir, "clickhouse_to_flatfile.csv");
      await fs.mkdir(outputDir, { recursive: true });
      const csvStream = stringify({ header: true, columns: selectedColumns });
      const fileStream = createWriteStream(outputPath);

      // Stream ClickHouse query results to CSV
      await new Promise<void>((resolve, reject) => {
        let rowCount = 0;
        streamQuery(
          config as ClickHouseConfig,
          query,
          (row: Record<string, unknown>) => {
            csvStream.write(row);
            rowCount++;
          },
          () => {
            csvStream.end();
          },
          (err: Error) => {
            csvStream.end();
            reject(err);
          }
        );
        csvStream.pipe(fileStream);
        fileStream.on("finish", () => {
          ingestedCount = rowCount;
          resolve();
        });
        fileStream.on("error", (err) => {
          reject(err);
        });
      });
    } else if (sourceType === "flatFile") {
      // Flat File → ClickHouse
      if (!config.fileName) {
        return NextResponse.json({ error: "File name must be provided." }, { status: 400 });
      }
      const filePath = path.join(process.cwd(), config.fileName);
      const batchSize = 1000;
      const clickhouseConfig = config as ClickHouseConfig;
      const table = selectedTables && selectedTables[0];
      if (!table) {
        return NextResponse.json({ error: "Target ClickHouse table must be specified." }, { status: 400 });
      }
      // Get columns and types from ClickHouse table for mapping
      const client = getClickHouseClient(clickhouseConfig);
      const resultSet = await client.query({ query: `DESCRIBE TABLE ${table}`, format: "JSONEachRow" });
      const columnsResult = (await resultSet.json()) as Record<string, unknown>[];
      // Each row: { name, type, ... }
      const tableColumns = columnsResult.map((row) =>
        typeof row["name"] === "string"
          ? row["name"]
          : typeof row["field"] === "string"
          ? row["field"]
          : String(Object.values(row)[0] ?? "")
      );
      const columnTypes: Record<string, string> = {};
      columnsResult.forEach((row) => {
        const col =
          typeof row["name"] === "string"
            ? row["name"]
            : typeof row["field"] === "string"
            ? row["field"]
            : String(Object.values(row)[0] ?? "");
        columnTypes[col] = typeof row["type"] === "string" ? row["type"] : "";
      });

      // Helper: Convert value to ClickHouse type
      function convertToType(value: unknown, type: string) {
        if (value === null || value === undefined || value === "") return null;
        if (/^Int/i.test(type)) return parseInt(String(value), 10);
        if (/^Float/i.test(type) || /^Decimal/i.test(type)) return parseFloat(String(value));
        if (/^DateTime/i.test(type) || /^Date/i.test(type)) return new Date(String(value));
        if (/^UUID/i.test(type)) return String(value);
        if (/^String/i.test(type) || /^FixedString/i.test(type)) return String(value);
        if (/^Nullable\((.+)\)/i.test(type)) {
          // Nullable type, extract inner type
          const innerType = type.match(/^Nullable\((.+)\)/i)![1];
          return convertToType(value, innerType);
        }
        return value;
      }

      // Stream CSV in batches and insert into ClickHouse
      await new Promise<void>((resolve, reject) => {
        parseCSVFileStream(
          { filePath, delimiter: config.delimiter, batchSize },
          async (batch: Record<string, unknown>[]) => {
            // Insert batch into ClickHouse
            if (batch.length === 0) return;
            // Map and convert CSV fields to ClickHouse columns/types
            const insertRows = batch.map((row) => {
              const mapped: Record<string, unknown> = {};
              tableColumns.forEach((col) => {
                mapped[col] = convertToType(row[col], columnTypes[col]);
              });
              return mapped;
            });
            try {
              await client.insert({
                table,
                values: insertRows,
                format: "JSONEachRow"
              });
              ingestedCount += insertRows.length;
            } catch (err: unknown) {
              let message = "Unknown error";
              if (err && typeof err === "object" && "message" in err && typeof (err as { message: unknown }).message === "string") {
                message = (err as { message: string }).message;
              }
              reject(new Error("ClickHouse insert error: " + message));
            }
          },
          () => {
            resolve();
          },
          (err: Error) => {
            reject(err);
          }
        );
      });
    } else {
      return NextResponse.json({ error: "Invalid sourceType" }, { status: 400 });
    }

    return NextResponse.json({ recordCount: ingestedCount, message: "Ingestion successful" });
  } catch (error: unknown) {
    function hasMessage(e: unknown): e is { message: string } {
      return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
    }
    let message = "Unknown error";
    if (hasMessage(error)) {
      message = error.message;
    }
    return NextResponse.json({ error: "Ingestion failed: " + message }, { status: 500 });
  }
}
