"use client";

import React, { useState, ChangeEvent, DragEvent } from "react";
import { FaDatabase, FaFileCsv, FaPlug, FaColumns, FaEye, FaPlay, FaSyncAlt, FaCheckCircle, FaExclamationCircle, FaUpload } from "react-icons/fa";

// Modern ProgressBar
const ProgressBar = ({ progress }: { progress: number }) => (
  <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
    <div
      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300"
      style={{ width: `${progress}%` }}
    ></div>
  </div>
);

export default function Page() {
  const [sourceType, setSourceType] = useState("clickhouse");
  const [config, setConfig] = useState({
    host: "",
    port: "",
    database: "",
    user: "",
    jwt: "",
    fileName: "",
    delimiter: ","
  });
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [joinCondition, setJoinCondition] = useState("");
  const [status, setStatus] = useState("");
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [recordCount, setRecordCount] = useState<number | null>(null);
  const [progress, setProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // --- Handlers (restored from previous version) ---
  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfig({ ...config, [e.target.name]: e.target.value });
  };

  function getJwtExpiry(jwt: string): { expired: boolean; expDate: Date | null } {
    if (!jwt) return { expired: false, expDate: null };
    try {
      const payload = JSON.parse(atob(jwt.split(".")[1]));
      if (!payload.exp) return { expired: false, expDate: null };
      const expDate = new Date(payload.exp * 1000);
      const expired = expDate.getTime() < Date.now();
      return { expired, expDate };
    } catch {
      return { expired: false, expDate: null };
    }
  }

  const connectToClickHouse = async () => {
    const { expired, expDate } = getJwtExpiry(config.jwt);
    if (expired) {
      setStatus(
        "JWT token is expired" +
          (expDate ? ` (expired at ${expDate.toLocaleString()})` : "") +
          ". Please provide a valid token."
      );
      return;
    }
    setStatus("Connecting to ClickHouse...");
    try {
      const response = await fetch("/api/clickhouse/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          host: config.host,
          port: config.port,
          database: config.database,
          user: config.user,
          jwt: config.jwt,
        }),
      });
      const result = await response.json();
      if (result.error) {
        setStatus("Error: " + result.error);
        setTables([]);
      } else {
        setTables(result.tables || []);
        setStatus("Connected. Tables loaded.");
      }
    } catch (error: unknown) {
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
        message = (error as { message: string }).message;
      }
      setStatus("Failed to connect: " + message);
      setTables([]);
    }
  };

  const loadColumns = async () => {
    if (sourceType === "clickhouse") {
      if (selectedTables.length === 0) {
        setStatus("Please select at least one table.");
        return;
      }
      setStatus("Fetching columns...");
      try {
        let allColumns: string[] = [];
        for (const table of selectedTables) {
          const response = await fetch("/api/clickhouse/columns", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              host: config.host,
              port: config.port,
              database: config.database,
              user: config.user,
              jwt: config.jwt,
              table,
            }),
          });
          const result = await response.json();
          if (result.error) {
            setStatus("Error: " + result.error);
            return;
          }
          allColumns = [...allColumns, ...result.columns];
        }
        const uniqueColumns = Array.from(new Set(allColumns));
        setColumns(uniqueColumns);
        setStatus("Columns fetched.");
      } catch (error: unknown) {
        let message = "Unknown error";
        if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
          message = (error as { message: string }).message;
        }
        setStatus("Failed to fetch columns: " + message);
        setColumns([]);
      }
    } else {
      setStatus("Parsing flat file header...");
      try {
        const response = await fetch(
          `/api/flatfile/columns?file=${encodeURIComponent(config.fileName)}&delimiter=${encodeURIComponent(config.delimiter || ",")}`
        );
        const result = await response.json();
        if (result.error) {
          setStatus("Error: " + result.error);
          setColumns([]);
        } else {
          setColumns(result.columns || []);
          setStatus("Columns fetched.");
        }
      } catch (error: unknown) {
        let message = "Unknown error";
        if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
          message = (error as { message: string }).message;
        }
        setStatus("Failed to fetch flat file columns: " + message);
        setColumns([]);
      }
    }
  };

  const previewDataHandler = async () => {
    setStatus("Fetching preview data...");
    try {
      const response = await fetch("/api/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          config,
          selectedTables,
          joinCondition: sourceType === "clickhouse" && selectedTables.length > 1 ? joinCondition : undefined,
          selectedColumns,
        }),
      });
      const result = await response.json();
      if (result.error) {
        setStatus("Error: " + result.error);
        setPreviewData([]);
      } else {
        setPreviewData(result.dataPreview || []);
        setStatus("Preview data loaded.");
      }
    } catch (error: unknown) {
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
        message = (error as { message: string }).message;
      }
      setStatus("Preview failed: " + message);
      setPreviewData([]);
    }
  };

  const startIngestion = async () => {
    if (sourceType === "clickhouse") {
      const { expired, expDate } = getJwtExpiry(config.jwt);
      if (expired) {
        setStatus(
          "JWT token is expired" +
            (expDate ? ` (expired at ${expDate.toLocaleString()})` : "") +
            ". Please provide a valid token."
        );
        setProgress(0);
        return;
      }
    }
    setStatus("Starting ingestion...");
    setProgress(0);
    try {
      for (let p = 10; p <= 90; p += 20) {
        setProgress(p);
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      const response = await fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sourceType,
          config,
          selectedTables: sourceType === "clickhouse" ? selectedTables : undefined,
          joinCondition:
            sourceType === "clickhouse" && selectedTables.length > 1
              ? joinCondition
              : undefined,
          selectedColumns
        })
      });
      const result = await response.json();
      if (result.error) {
        setStatus("Error: " + result.error);
      } else {
        setRecordCount(result.recordCount);
        setStatus("Ingestion complete. Total records ingested: " + result.recordCount);
      }
      setProgress(100);
    } catch (error: unknown) {
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
        message = (error as { message: string }).message;
      }
      setStatus("Ingestion failed: " + message);
      setProgress(0);
    }
  };

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setUploadedFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setUploadedFile(e.dataTransfer.files[0]);
      e.dataTransfer.clearData();
    }
  };

  const uploadFile = async () => {
    if (!uploadedFile) {
      setUploadStatus("No file selected.");
      return;
    }
    setUploadStatus("Uploading file...");
    const formData = new FormData();
    formData.append("file", uploadedFile);
    try {
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData
      });
      const result = await response.json();
      if (result.error) {
        setUploadStatus("Upload failed: " + result.error);
      } else {
        setUploadStatus("File uploaded successfully.");
      }
    } catch (error: unknown) {
      let message = "Unknown error";
      if (error && typeof error === "object" && "message" in error && typeof (error as { message: unknown }).message === "string") {
        message = (error as { message: string }).message;
      }
      setUploadStatus("Upload error: " + message);
    }
  };

  const handleSourceTypeChange = (value: string) => {
    setSourceType(value);
    setConfig({
      host: "",
      port: "",
      database: "",
      user: "",
      jwt: "",
      fileName: "",
      delimiter: ","
    });
    setTables([]);
    setSelectedTables([]);
    setColumns([]);
    setSelectedColumns([]);
    setJoinCondition("");
    setPreviewData([]);
    setRecordCount(null);
    setStatus("");
    setUploadedFile(null);
    setUploadStatus("");
    setProgress(0);
  };
  // --- End Handlers ---

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex flex-col items-center py-10 px-2">
      <div className="w-full max-w-4xl bg-white shadow-2xl rounded-3xl p-8 md:p-12 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-4">
            <span className="text-4xl" role="img" aria-label="bridge">🌉</span>
            <h1 className="text-3xl md:text-4xl font-extrabold text-blue-600 tracking-tight">
              DataZen Bridge
            </h1>
          </div>
        </div>

        {/* Source Selection */}
        <div className="bg-gray-50 rounded-2xl p-6 shadow-inner">
          <label className="block text-lg font-semibold text-gray-700 mb-2">
            <FaPlug className="inline mr-2 text-blue-400" />
            Select Data Source
          </label>
          <div className="flex gap-4">
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-lg font-medium ${
                sourceType === "clickhouse"
                  ? "bg-blue-100 border-blue-500 text-blue-700 shadow"
                  : "bg-white border-gray-300 text-gray-600 hover:border-blue-300"
              }`}
              onClick={() => handleSourceTypeChange("clickhouse")}
            >
              <FaDatabase /> ClickHouse
            </button>
            <button
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 transition-all text-lg font-medium ${
                sourceType === "flatFile"
                  ? "bg-blue-100 border-blue-500 text-blue-700 shadow"
                  : "bg-white border-gray-300 text-gray-600 hover:border-blue-300"
              }`}
              onClick={() => handleSourceTypeChange("flatFile")}
            >
              <FaFileCsv /> Flat File
            </button>
          </div>
        </div>

        {/* Configuration Section */}
        <div className="flex flex-col gap-8">
          {/* ClickHouse Config */}
          {sourceType === "clickhouse" && (
            <div className="w-full bg-white border border-blue-100 rounded-2xl shadow-lg p-8 flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-blue-700 flex items-center gap-2 mb-2">
                <FaDatabase className="text-blue-500" /> ClickHouse Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="host" placeholder="Host" value={config.host} onChange={handleInputChange}
                  className="input-modern" />
                <input type="text" name="port" placeholder="Port (e.g., 9440 or 9000)" value={config.port} onChange={handleInputChange}
                  className="input-modern" />
                <input type="text" name="database" placeholder="Database" value={config.database} onChange={handleInputChange}
                  className="input-modern" />
                <input type="text" name="user" placeholder="User" value={config.user} onChange={handleInputChange}
                  className="input-modern" />
                <input type="text" name="jwt" placeholder="JWT Token" value={config.jwt} onChange={handleInputChange}
                  className="input-modern md:col-span-2" />
              </div>
              <button
                onClick={connectToClickHouse}
                className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium shadow bg-[#1a73e8] text-white text-lg transition-all duration-150 hover:bg-[#1765c1] focus:outline-none focus:ring-4 focus:ring-blue-200 mt-2"
              >
                <FaPlug className="text-xl" /> Connect & Load Tables
              </button>
              {tables.length > 0 && (
                <div>
                  <h3 className="text-base font-semibold text-blue-700 mb-2">Select Table(s)</h3>
                  <div className="flex flex-wrap gap-3">
                    {tables.map((table, idx) => (
                      <label key={idx} className="flex items-center gap-2 bg-blue-50 px-3 py-1 rounded-lg border border-blue-200 shadow-sm">
                        <input
                          type="checkbox"
                          value={table}
                          checked={selectedTables.includes(table)}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedTables([...selectedTables, table]);
                            else setSelectedTables(selectedTables.filter((t) => t !== table));
                          }}
                          className="accent-blue-600"
                        />
                        <span className="text-blue-800">{table}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Flat File Config */}
          {sourceType === "flatFile" && (
            <div className="w-full bg-white border border-indigo-100 rounded-2xl shadow-lg p-8 flex flex-col gap-6">
              <h2 className="text-2xl font-bold text-indigo-700 flex items-center gap-2 mb-2">
                <FaFileCsv className="text-indigo-500" /> Flat File Configuration
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input type="text" name="fileName" placeholder="File Name (with path if needed)" value={config.fileName} onChange={handleInputChange}
                  className="input-modern" />
                <input type="text" name="delimiter" placeholder="Delimiter (e.g., , or ;)" value={config.delimiter} onChange={handleInputChange}
                  className="input-modern" />
              </div>
              <div
                className="border-2 border-dashed border-indigo-300 rounded-xl p-6 text-center cursor-pointer hover:border-indigo-500 transition"
                onDragOver={handleDragOver}
                onDrop={handleDrop}
              >
                <label htmlFor="file-input" className="block cursor-pointer">
                  <FaFileCsv className="mx-auto text-3xl text-indigo-400" />
                  {uploadedFile ? (
                    <p className="mt-2 text-indigo-700 font-medium">{uploadedFile.name}</p>
                  ) : (
                    <p className="mt-2 text-indigo-500">Drag & drop your CSV/data file here, or click to select.</p>
                  )}
                </label>
                <input type="file" id="file-input" onChange={handleFileChange} className="hidden" />
              </div>
              <button
                onClick={uploadFile}
                className="w-full flex items-center justify-center gap-2 px-8 py-3 rounded-full font-medium shadow bg-[#1a73e8] text-white text-lg transition-all duration-150 hover:bg-[#1765c1] focus:outline-none focus:ring-4 focus:ring-blue-200"
              >
                <FaUpload className="text-xl" /> Upload File
              </button>
              {uploadStatus && (
                <p className="text-center text-sm text-indigo-700 mt-1">{uploadStatus}</p>
              )}
            </div>
          )}
        </div>

        {/* Columns & Join Section */}
        {(sourceType === "clickhouse" || sourceType === "flatFile") && (
          <div className="bg-white rounded-2xl p-6 shadow flex flex-col gap-4">
            <div className="flex flex-wrap gap-6 items-center justify-center py-2">
              <button
                onClick={loadColumns}
                aria-label="Load Columns"
                disabled={status.startsWith("Fetching") || status.startsWith("Starting") || progress > 0 && progress < 100}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-xl bg-gradient-to-r from-blue-500 to-blue-700 text-white text-lg transition-all duration-200 hover:scale-105 hover:from-blue-600 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-200 ${status.startsWith("Fetching") || status.startsWith("Starting") || (progress > 0 && progress < 100) ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {status.startsWith("Fetching") ? (
                  <FaSyncAlt className="text-xl animate-spin" />
                ) : (
                  <FaColumns className="text-xl" />
                )} Load Columns
              </button>
              <button
                onClick={previewDataHandler}
                aria-label="Preview Data"
                disabled={status.startsWith("Fetching") || status.startsWith("Starting") || progress > 0 && progress < 100}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-xl bg-gradient-to-r from-green-400 to-green-600 text-white text-lg transition-all duration-200 hover:scale-105 hover:from-green-500 hover:to-green-700 focus:outline-none focus:ring-4 focus:ring-green-200 ${status.startsWith("Fetching") || status.startsWith("Starting") || (progress > 0 && progress < 100) ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {status.startsWith("Fetching") ? (
                  <FaSyncAlt className="text-xl animate-spin" />
                ) : (
                  <FaEye className="text-xl" />
                )} Preview Data
              </button>
              <button
                onClick={startIngestion}
                aria-label="Start Ingestion"
                disabled={status.startsWith("Starting") || progress > 0 && progress < 100}
                className={`inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold shadow-xl bg-gradient-to-r from-purple-500 to-purple-700 text-white text-lg transition-all duration-200 hover:scale-105 hover:from-purple-600 hover:to-purple-800 focus:outline-none focus:ring-4 focus:ring-purple-200 ${status.startsWith("Starting") || (progress > 0 && progress < 100) ? "opacity-60 cursor-not-allowed" : ""}`}
              >
                {status.startsWith("Starting") || (progress > 0 && progress < 100) ? (
                  <FaSyncAlt className="text-xl animate-spin" />
                ) : (
                  <FaPlay className="text-xl" />
                )} Start Ingestion
              </button>
            </div>
            {columns.length > 0 && (
              <div>
                <h3 className="text-base font-semibold text-gray-700 mb-2">Select Columns</h3>
                <div className="flex flex-wrap gap-3">
                  {columns.map((col, idx) => (
                    <label key={idx} className="flex items-center gap-2 bg-gray-50 px-3 py-1 rounded-lg border border-gray-200 shadow-sm">
                      <input
                        type="checkbox"
                        value={col}
                        checked={selectedColumns.includes(col)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedColumns([...selectedColumns, col]);
                          else setSelectedColumns(selectedColumns.filter((c) => c !== col));
                        }}
                        className="accent-blue-600"
                      />
                      <span className="text-gray-800">{col}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {sourceType === "clickhouse" && selectedTables.length > 1 && (
              <div>
                <h3 className="text-base font-semibold text-blue-700 mb-2">Join Conditions</h3>
                <input
                  type="text"
                  placeholder="Enter join keys/conditions (e.g., table1.id = table2.ref_id)"
                  value={joinCondition}
                  onChange={(e) => setJoinCondition(e.target.value)}
                  className="input-modern"
                />
              </div>
            )}
          </div>
        )}

        {/* Data Preview */}
        {previewData.length > 0 && (
          <div className="bg-gray-50 rounded-2xl p-6 shadow-inner">
            <h3 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2">
              <FaEye className="text-green-500" /> Data Preview
            </h3>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-gray-700">
                <thead>
                  <tr>
                    {Object.keys(previewData[0] || {}).map((col, idx) => (
                      <th key={idx} className="px-3 py-2 bg-gray-200 font-semibold">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, i) => (
                    <tr key={i} className="even:bg-gray-100">
                      {Object.values(row).map((val, j) => (
                        <td key={j} className="px-3 py-1">{String(val)}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Status & Results */}
        <div className="bg-white rounded-2xl p-6 shadow flex flex-col gap-2 items-center">
          <ProgressBar progress={progress} />
          <div className="flex items-center gap-2 text-lg text-gray-700 mt-2">
            {status.startsWith("Error") || status.startsWith("Failed") ? (
              <FaExclamationCircle className="text-red-500" />
            ) : status.toLowerCase().includes("complete") ? (
              <FaCheckCircle className="text-green-500" />
            ) : (
              <FaSyncAlt className="text-blue-400 animate-spin" />
            )}
            <span className="font-semibold">{status}</span>
          </div>
          {sourceType === "clickhouse" && config.jwt && (() => {
            const { expired, expDate } = getJwtExpiry(config.jwt);
            return (
              <span
                className={
                  expired
                    ? "text-red-600 font-semibold"
                    : "text-green-600 font-semibold"
                }
              >
                JWT Expiry:{" "}
                {expDate ? expDate.toLocaleString() : "Unknown"}
                {expired ? " (Expired)" : ""}
              </span>
            );
          })()}
          {recordCount !== null && (
            <div className="mt-2 text-center">
              <h3 className="text-xl font-bold text-blue-500 flex items-center gap-2">
                <FaCheckCircle className="text-green-500" /> Total Records Ingested: {recordCount}
              </h3>
            </div>
          )}
        </div>
      </div>

      {/* Tailwind utility classes for modern input/button */}
      <style jsx global>{`
        .input-modern {
          @apply w-full border border-gray-300 rounded-xl py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400 transition;
        }
        .btn-modern {
          @apply flex items-center gap-2 px-5 py-2 rounded-xl font-semibold shadow transition;
        }
      `}</style>
    </div>
  );
}
