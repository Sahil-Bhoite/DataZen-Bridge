# **App Name**: DataZen Bridge

## Core Features:

- Connection Setup: Connection Configuration: Allow users to toggle between ClickHouse and flat file sources, providing form fields for connection details with floating labels.
- Schema Selection: Schema Selection & Preview: Enable users to select tables (for ClickHouse) or upload files (for flat files), choose columns with a selector, and preview the first 100 rows with type indicators.
- Data Ingestion: Data Ingestion & Monitoring: Implement a progress bar and live record counter to track data ingestion progress, providing a completion summary upon finishing.
- Zen Mode: Zen Mode Toggle: Apply Japanese-inspired styling (natural colors, subtle animations) and use a traditional Japanese color scheme.
- AI Insights: AI-Powered Data Insights: Use an AI tool to provide insights and summaries of the data being transferred, highlighting potential data quality issues or anomalies. Display these insights in the execution monitor.

## Style Guidelines:

- Primary colors: Beige and dark wood tones to reflect a natural and minimalist aesthetic.
- Accent color: Deep red (#A52A2A, like a dark wood) to draw attention to important elements and CTAs, inspired by traditional Japanese architecture.
- Clean and readable sans-serif fonts for data display and UI elements.
- Simple, geometric icons to complement the clean lines of the design, using a thin stroke weight.
- Asymmetric layouts with generous white space, mimicking the balance found in Japanese gardens and shoji screens.
- Subtle transitions and animations, such as a cherry blossom petal effect on task completion in Zen Mode.

## Original User Request:
Create a full-stack web application for bidirectional data integration between ClickHouse and flat files with the following specifications:

Backend Requirements (Golang preferred):

Implement two main services:
ClickHouse Service:
Connect using official Go client with JWT authentication
Support queries with column selection
Handle table discovery and schema inspection
Implement JOIN functionality for bonus feature
File Service:
Process CSV/TSV files with configurable delimiters
Stream data to optimize memory usage
Validate file structure against target schema
Create REST API endpoints for:
Connection testing
Schema discovery
Data preview (100 rows)
Full ingestion
Progress tracking
Add JWT validation middleware for secure API calls
Frontend Requirements (React with TypeScript):

UI Design:
Google Material Design 3 components
Japanese architectural inspiration:
Clean lines and minimalism (like shoji screens)
Natural color palette (beige, dark wood tones, accent reds)
Asymmetric layouts with careful white space
Subtle paper/texture backgrounds
Implement four main views:
Connection Configuration:
Toggle between ClickHouse/flat file source
Form fields with floating labels
Test connection button with status indicator
Schema Selection:
Expandable table list (for ClickHouse)
File upload dropzone (for flat files)
Column selector with search/filter
JOIN builder interface (bonus)
Preview Panel:
Data table showing first 100 rows
Type indicators for columns
Dark/light mode toggle
Execution Monitor:
Progress bar with estimated time
Live record counter
Completion summary
Use these specific libraries:
Material-UI (MUI) v5+
react-query for API calls
xstate for state management
Papa Parse for CSV handling
react-window for efficient data rendering
Special Features:

Implement a 'Zen Mode' toggle that:
Applies Japanese-inspired styling
Adds subtle animation like cherry blossom petals on completion
Uses traditional Japanese color schemes
Create a responsive layout that works on desktop and tablet
Add these Material 3 components:
Filled text fields with animated labels
Tonal buttons with ripple effects
Card-based interface panels
Dynamic color theming
Quality Requirements:

Full TypeScript typing throughout
Unit tests for critical components
Error boundaries with graceful recovery
Accessibility compliance (WCAG 2.1 AA)
Docker setup for easy deployment
Implementation Guidance:

First create the backend service with:
API contract (OpenAPI spec)
Connection pooling for ClickHouse
Streaming file processor
Then build the frontend:
Start with layout scaffolding
Implement state management
Add theming system
Connect API endpoints
Finally implement:
The bonus JOIN feature
Zen Mode styling
Performance optimizations
Provide the complete solution with:

Backend service code
Frontend React components
Dockerfiles for both
Sample configuration
Brief setup documentation
Include frequent code comments explaining key decisions and architecture."


name it something nice
  