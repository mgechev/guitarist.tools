# Guitarist.tools: CAGED Master Specification

## Overview
A premium, interactive web application designed to help guitarists master the fretboard through the CAGED system. The app allows users to visualize Major and Minor scales, target pentatonic and chord tones, and test their fretboard knowledge via customizable practice challenges.

## Aesthetics and UX
- **Design Inspiration**: "FretMaster" style – sharp, professional, minimalist, and high-contrast (no rounded corners for main panels).
- **Typography**: Uses modern typography (`Inter` for UI, `Playfair Display` for bold serif headers).
- **Theming**: Fully responsive Light and Dark mode that automatically synchronizes with the user's Operating System preferences. Includes a manual toggle override in the sidebar.
- **Navigation**: Persistent left-hand sidebar navigation containing the app logo, main feature links, and theme toggle.

## Core Features

### 1. Fretboard Engine
- A 22-fret standard guitar fretboard in standard tuning (E-A-D-G-B-E).
- Dynamic rendering of notes filtered by the selected key, scale, and CAGED shape.
- **Note Formatting**:
  - The Root note is distinctly styled (inverted colors, larger size).
  - Standard scale notes are displayed as subtle background circles.
- **Toggles & Highlights**:
  - **Highlight Pentatonic**: Distinct glowing shadow/border to emphasize the 5-note pentatonic skeleton within the diatonic scale.
  - **Highlight Chord**: Thick white/dark border to emphasize the triad chord tones (1st, 3rd, 5th degrees) of the current shape.
  - Includes an explanatory visual legend below the headers.

### 2. Explore Mode
- Provides full manual control to explore the fretboard.
- **Controls**:
  - Dropdown for **Key** (C, C#, D, etc.).
  - Dropdown for **Scale** (Major, Minor).
  - Dropdown for **CAGED Shape** (C, A, G, E, D).
- Updates the Fretboard visualization and headers instantly based on the selection.

### 3. Practice Mode
- A robust challenge mode to test the user's CAGED system recall.
- **Configuration Panel**:
  - Users can select which **Scales** to include (Major, Minor).
  - Users can select which **Keys** to include (All, None, or specifically toggle individual keys).
- **Challenge Flow**:
  1. User clicks **"Pick Random Challenge"**.
  2. A random combination of allowed Key, Scale, and Shape is generated.
  3. The fretboard is hidden, and the user is prompted (e.g., "Find the E Minor scale in the G Shape").
  4. User clicks **"Show Answer"** to reveal the correct fretboard shape.
- Pentatonic and Chord highlighting toggles are also available on the answer screen.

### 4. Metronome Widget
- A globally accessible, floating metronome widget fixed to the bottom right of the screen.
- **Engine**: Built utilizing the Web Audio API with a "lookahead" scheduling system to guarantee perfect, drift-free timing independent of browser rendering limits.
- **Features**:
  - Tempo Slider and numeric input (30 - 300 BPM).
  - **Tap Tempo** button that calculates moving average intervals.
  - **Time Signature** configuration (1/4 to 8/4) with a distinct higher-pitch accent on the downbeat.
  - **Subdivisions** dropdown (Quarter notes, Eighth notes, Eighth Triplets, Sixteenth notes).
  - Visual synchronized tick indicators that flash to the beat.

## Technical Architecture
- **Framework**: Built with React (Vite).
- **Styling**: Vanilla CSS (`index.css`) relying heavily on CSS Custom Properties (Variables) to manage the dark/light theming system.
- **Icons**: Google Material Symbols.
- **Deployment**: Configured to deploy automatically to GitHub Pages via a GitHub Actions workflow (`.github/workflows/deploy.yml`) triggered on pushes to the `main` branch.
