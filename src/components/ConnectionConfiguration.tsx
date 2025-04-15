"use client";

import React, { ChangeEvent } from "react";

export interface Config {
  host: string;
  port: string;
  database: string;
  user: string;
  jwt: string;
  fileName: string;
  delimiter: string;
}

export interface ConnectionConfigurationProps {
  sourceType: string;
  config: Config;
  onInputChange: (e: ChangeEvent<HTMLInputElement>) => void;
  onSourceTypeChange: (value: string) => void;
  onConnect?: () => void;
}

const ConnectionConfiguration: React.FC<ConnectionConfigurationProps> = ({
  sourceType,
  config,
  onInputChange,
  onSourceTypeChange,
  onConnect,
}) => {
  return (
    <div className="mb-10">
      <label className="block text-xl text-gray-700 font-semibold mb-3">
        Select Data Source
      </label>
      <select
        value={sourceType}
        onChange={(e) => onSourceTypeChange(e.target.value)}
        className="w-full border border-gray-300 rounded-xl py-3 px-5 text-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
      >
        <option value="clickhouse">ClickHouse</option>
        <option value="flatFile">Flat File</option>
      </select>

      {sourceType === "clickhouse" ? (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            ClickHouse Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              name="host"
              placeholder="Host"
              value={config.host}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="port"
              placeholder="Port (e.g., 9440 or 9000)"
              value={config.port}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="database"
              placeholder="Database"
              value={config.database}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="user"
              placeholder="User"
              value={config.user}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="jwt"
              placeholder="JWT Token"
              value={config.jwt}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
          {onConnect && (
            <div className="flex justify-center mt-6">
              <button
                onClick={onConnect}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition duration-200"
              >
                Connect & Load Tables
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="mt-10">
          <h2 className="text-2xl font-bold text-gray-800 mb-5">
            Flat File Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <input
              type="text"
              name="fileName"
              placeholder="File Name (with path)"
              value={config.fileName}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
            <input
              type="text"
              name="delimiter"
              placeholder="Delimiter (e.g., , or ;)"
              value={config.delimiter}
              onChange={onInputChange}
              className="w-full border border-gray-300 rounded-xl py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectionConfiguration;
