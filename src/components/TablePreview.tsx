"use client";

import React from "react";

export interface TablePreviewProps {
  previewData: Record<string, unknown>[];
}

const TablePreview: React.FC<TablePreviewProps> = ({ previewData }) => {
  if (!previewData || previewData.length === 0) {
    return null;
  }

  // Use the keys from the first record as headers.
  const headers = Object.keys(previewData[0]);

  return (
    <div className="mb-10">
      <h3 className="text-2xl font-bold text-gray-800 mb-5">Data Preview</h3>
      <div className="overflow-auto border border-gray-300 rounded-xl">
        <table className="min-w-full">
          <thead className="bg-gray-100">
            <tr>
              {headers.map((header, index) => (
                <th
                  key={index}
                  className="px-4 py-2 border border-gray-300 text-gray-700 text-left"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewData.map((row, rowIndex) => (
              <tr key={rowIndex} className="odd:bg-white even:bg-gray-50">
                {headers.map((header, colIndex) => (
                  <td
                    key={colIndex}
                    className="px-4 py-2 border border-gray-300 text-gray-600"
                  >
                    {String(row[header] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TablePreview;
