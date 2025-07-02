# AI Model Comparison Tool - Angular Frontend

A modern Angular frontend for comparing responses from multiple AI models using Material Design components.

## Features

- **Modern UI**: Built with Angular 17 and Material Design
- **Real-time Streaming**: WebSocket connection for live response updates
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Interactive Model Cards**: Expandable cards with copy functionality
- **Processing Controls**: Configurable processing modes and response lengths
- **Summary Generation**: AI-powered analysis of all model responses
- **Export Functionality**: Copy or download comparison reports

## Prerequisites

- Node.js 18+ and npm
- Backend server running on port 8000

## Installation

```bash
# Install dependencies
npm install

# Start development server
npm start

# Or serve with specific configuration
npm run serve
```

## Development

```bash
# Development build
npm run build:dev

# Production build
npm run build

# Watch mode for development
npm run watch
```

## Project Structure

```
src/
├── app/
│   ├── components/
│   │   ├── model-card.component.ts          # Individual model response cards
│   │   └── processing-controls.component.ts  # Question form and controls
│   ├── models/
│   │   └── model.interfaces.ts              # TypeScript interfaces
│   ├── services/
│   │   ├── api.service.ts                   # REST API communication
│   │   └── websocket.service.ts             # WebSocket handling
│   ├── app.component.ts                     # Main application component
│   └── main.ts                              # Application bootstrap
└── assets/                                  # Static assets
```

## Configuration

The application automatically connects to:
- Backend API: `http://localhost:8000/api`
- WebSocket: `ws://localhost:8000/ws`

## Features Overview

### Processing Controls
- **Processing Modes**: Batch (3 at a time), Parallel (all at once), Sequential (one by one)
- **Response Length**: Brief, Short, Medium, Long, Detailed, or Custom line count
- **Stop Functionality**: Halt processing at any time
- **Model Refresh**: Reload available models from Ollama

### Model Cards
- **Real-time Updates**: Streaming response display
- **Status Indicators**: Visual feedback for pending, streaming, completed, error states
- **Expandable Content**: Preview or full response view
- **Word Count**: Track response length
- **Copy Function**: Copy individual responses to clipboard

### Summary & Analysis
- **AI-Generated Summary**: Best model analyzes all responses
- **Statistics**: Completion rates and performance metrics
- **Recommendations**: Insights about model performance
- **Export Options**: Copy summary or download detailed report

## Styling

- **Material Design**: Consistent UI components
- **Custom Themes**: Gradient backgrounds and modern styling
- **Responsive Layout**: Mobile-first design approach
- **Dark/Light Adaptation**: Respects system preferences

## Browser Support

- Chrome/Edge 90+
- Firefox 90+
- Safari 14+

## Deployment

For production deployment:

```bash
npm run build
# Serve the dist/ folder with your preferred web server
```

The built files will be in the `dist/` directory and can be served by any static web server.