# Guitar Fretboard Application Specification

## Overview
A dynamic web application to help guitarists learn the fretboard, specifically utilizing the CAGED system. The app allows users to visualize scales (Major/Minor) across the fretboard and highlights the Pentatonic notes. It also features a practice mode to test knowledge.

## Core Features

### 1. Fretboard Visualization
- A 22-fret standard guitar fretboard in standard tuning (E-A-D-G-B-E).
- Distinct visual representation of notes.
- Only notes belonging to the selected scale and shape are visible.
- The root note is clearly distinguished.
- Notes belonging to the pentatonic scale have a distinct outline or shadow.

### 2. Explore Mode (Tab 1)
- Dropdown for **Key** (C, C#, D, D#, E, F, F#, G, G#, A, A#, B).
- Dropdown for **Scale** (Major, Minor).
- Dropdown for **CAGED Shape** (C, A, G, E, D).
- Automatically updates the Fretboard based on selection.

### 3. Practice Mode (Tab 2)
- A mode to test the user's knowledge.
- Button: **"Pick Random"**. Clicking this selects a random Key, Scale, and Shape, displaying the challenge (e.g., "Find the E minor scale in the G shape").
- The fretboard is initially hidden or empty.
- Button: **"Show Answer"**. Reveals the correct shape on the fretboard.

### 4. Technical Requirements
- Built with React (Vite).
- Styled using Vanilla CSS (no Tailwind).
- Aesthetic: Premium, dynamic, responsive, and uses smooth animations and modern typography.
