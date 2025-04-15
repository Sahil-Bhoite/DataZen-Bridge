import { createReadStream, statSync, existsSync } from "fs";
import { parse } from "csv-parse";

/**
 * Options for parsing a flat file.
 */
export interface FlatFileOptions {
  filePath: string;
  delimiter?: string;
  maxRows?: number; // For preview
  batchSize?: number; // For ingestion
}

/**
 * Parses a CSV file and returns the records as an array of objects.
 * The first line of the file is assumed to be the header.
 * 
 * Enhanced: Validates file existence, supports maxRows for preview, and robust error handling.
 * 
 * @param options - FlatFileOptions with filePath and optional delimiter.
 * @returns Promise resolving to an array of records (objects).
 */
export const parseCSVFile = async (options: FlatFileOptions): Promise<Record<string, unknown>[]> => {
  if (!existsSync(options.filePath)) {
    throw new Error("CSV file does not exist: " + options.filePath);
  }
  const stats = statSync(options.filePath);
  if (stats.size === 0) {
    throw new Error("CSV file is empty: " + options.filePath);
  }
  return new Promise((resolve, reject) => {
    const records: Record<string, unknown>[] = [];
    let rowCount = 0;
    createReadStream(options.filePath)
      .pipe(parse({ delimiter: options.delimiter || ",", columns: true, trim: true }))
      .on("data", (row: Record<string, unknown>) => {
        if (options.maxRows && rowCount >= options.maxRows) return;
        records.push(row);
        rowCount++;
      })
      .on("error", (err: unknown) => {
        function hasMessage(e: unknown): e is { message: string } {
          return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
        }
        let message = "Unknown error";
        if (hasMessage(err)) {
          message = err.message;
        }
        reject(new Error("CSV parse error: " + message));
      })
      .on("end", () => {
        resolve(records);
      });
  });
};

/**
 * Streams a CSV file in batches for scalable ingestion.
 * Calls onBatch with each batch of records.
 * 
 * @param options - FlatFileOptions with filePath, delimiter, and batchSize.
 * @param onBatch - Callback for each batch of records.
 * @param onEnd - Callback when streaming is complete.
 * @param onError - Callback for errors.
 */
export const parseCSVFileStream = (
  options: FlatFileOptions,
  onBatch: (batch: Record<string, unknown>[]) => void,
  onEnd: () => void,
  onError: (err: Error) => void
) => {
  if (!existsSync(options.filePath)) {
    onError(new Error("CSV file does not exist: " + options.filePath));
    return;
  }
  const stats = statSync(options.filePath);
  if (stats.size === 0) {
    onError(new Error("CSV file is empty: " + options.filePath));
    return;
  }
  const batchSize = options.batchSize || 1000;
  const batch: Record<string, unknown>[] = [];
  createReadStream(options.filePath)
    .pipe(parse({ delimiter: options.delimiter || ",", columns: true, trim: true }))
    .on("data", (row: Record<string, unknown>) => {
      batch.push(row);
      if (batch.length >= batchSize) {
        onBatch(batch.splice(0, batch.length));
      }
    })
    .on("error", (err: unknown) => {
      function hasMessage(e: unknown): e is { message: string } {
        return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
      }
      let message = "Unknown error";
      if (hasMessage(err)) {
        message = err.message;
      }
      onError(new Error("CSV parse error: " + message));
    })
    .on("end", () => {
      if (batch.length > 0) {
        onBatch(batch);
      }
      onEnd();
    });
};
