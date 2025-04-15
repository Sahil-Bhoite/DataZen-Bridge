"use client";
import React from "react";

interface ErrorDisplayProps {
  errorMessage?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ errorMessage }) => {
  if (!errorMessage) return null;
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4">
      <span className="block sm:inline">{errorMessage}</span>
    </div>
  );
};

export default ErrorDisplay;
