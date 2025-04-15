import { createClient } from "@clickhouse/client";

export interface ClickHouseConfig {
  host: string;
  port: string;
  database: string;
  user: string;
  password?: string;
  jwt?: string;
  useTLS?: boolean;
  timeout?: number;
}

// Create and return a ClickHouse client instance with enhanced options
export const getClickHouseClient = (config: ClickHouseConfig) => {
  if (!config.host || !config.port || !config.database || !config.user) {
    throw new Error("Missing required ClickHouse connection parameters.");
  }
  const protocol = config.useTLS ? "https" : "http";
  const url = `${protocol}://${config.host}:${config.port}`;
  return createClient({
    host: url,
    database: config.database,
    username: config.user,
    password: config.jwt || config.password || "",
    // Optionally add TLS options here if needed
  });
};

// Fetches list of tables in the specified database via ClickHouse
export const fetchTables = async (config: ClickHouseConfig): Promise<string[]> => {
  try {
    const client = getClickHouseClient(config);
    const query = "SHOW TABLES";
    const resultSet = await client.query({ query, format: "JSONEachRow" });
    const result = await resultSet.json<Record<string, unknown>[]>();
    return result.map((row: Record<string, unknown>) =>
      (row["name"] as string) || (row["table"] as string) || Object.values(row)[0] as string
    );
  } catch (error) {
    console.error("ClickHouse fetchTables error:", error);
    throw new Error("Failed to fetch tables: " + (error as Error).message);
  }
};

// Fetches the column names from a specified table using ClickHouse
export const fetchColumns = async (config: ClickHouseConfig, table: string): Promise<string[]> => {
  try {
    const client = getClickHouseClient(config);
    const query = `DESCRIBE TABLE ${table}`;
    const resultSet = await client.query({ query, format: "JSONEachRow" });
    const result = await resultSet.json<Record<string, unknown>[]>();
    return result.map((row: Record<string, unknown>) =>
      (row["name"] as string) || (row["field"] as string) || Object.values(row)[0] as string
    );
  } catch (error) {
    console.error("ClickHouse fetchColumns error:", error);
    throw new Error("Failed to fetch columns: " + (error as Error).message);
  }
};

// Stream query results for large datasets (for ingestion/preview)
export const streamQuery = async (
  config: ClickHouseConfig,
  query: string,
  onRow: (row: Record<string, unknown>) => void,
  onEnd: () => void,
  onError: (err: Error) => void
) => {
  try {
    const client = getClickHouseClient(config);
    const resultSet = await client.query({ query, format: "JSONEachRow" });
    for await (const row of resultSet.stream()) {
      onRow(row);
    }
    onEnd();
  } catch (error) {
    onError(error as Error);
  }
};
