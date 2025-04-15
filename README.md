# DataZen Bridge

**DataZen Bridge** is a modern, production-ready data integration tool that enables seamless data movement between ClickHouse databases and flat files (CSV). With a user-friendly interface, robust type safety, and efficient ingestion/preview APIs, DataZen Bridge is ideal for data engineers and analysts who need to quickly connect, preview, and transfer data.

---<img width="1545" alt="Screenshot 2025-04-15 at 4 51 51 PM" src="https://github.com/user-attachments/assets/1176dddf-85ac-425b-8377-b69424364120" />


## Features

- **Connect to ClickHouse**: Securely connect to your ClickHouse instance using host, port, database, user, and JWT.
- **Flat File Support**: Upload and preview CSV or delimited files with custom delimiters.
- **Schema Discovery**: Automatically fetch table and column metadata from ClickHouse or flat files.
- **Data Preview**: Instantly preview up to 100 records from your data source before ingestion.
- **Bidirectional Ingestion**:
  - Export ClickHouse tables to CSV.
  - Import CSV data into ClickHouse tables with type-safe mapping.
- **Modern UI**: Responsive, accessible, and easy to use.
- **Production-Ready**: TypeScript, strict linting, and robust error handling.

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env` and fill in any required values.

3. **Run the development server:**
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

4. **Build for production:**
   ```bash
   npm run build
   npm start
   ```

---

## Usage

- **Connect to ClickHouse**: Enter your connection details and JWT, then load tables and columns.
- **Upload Flat File**: Drag and drop or select a CSV file, specify the delimiter, and upload.
- **Preview Data**: Use the preview feature to inspect data before ingestion.
- **Ingest Data**: Start ingestion to move data between ClickHouse and flat files.

---

## Contact

For questions please visit:  
**[https://sahil-bhoite.github.io/Website/](https://sahil-bhoite.github.io/Website/)**
