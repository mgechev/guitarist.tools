# guitarist.tools

A premium, interactive guitar fretboard web application that visualizes the CAGED system.

## Features

- **Explore Mode**: Visualize Major and Minor scales in any key and shape across the fretboard.
- **Practice Mode**: Test your knowledge with randomized learning challenges to master the CAGED system.

## Getting Started

### Prerequisites

- Node.js (and npm)

### Installation

1. Install the dependencies:
   ```bash
   npm install
   ```

### Development

To start the development server with Hot Module Replacement (HMR):

```bash
npm run dev
```

This will start the app locally (usually at `http://localhost:5173`).

## Production Build

To produce an optimized production bundle:

```bash
npm run build
```

This command will output the production-ready static files into the `dist` directory.

You can preview the production build locally by running:

```bash
npm run preview
```

## Deployment

This application is configured to deploy automatically to GitHub Pages via a GitHub Actions workflow.

### Deploying to GitHub Pages

Deployment is completely automated. Any code pushed to the `main` branch will automatically trigger the GitHub Actions workflow (`.github/workflows/deploy.yml`), which builds the static assets and publishes them to GitHub Pages.

To deploy a new version:
1. Commit your changes.
2. Push to the `main` branch:
   ```bash
   git push origin main
   ```
