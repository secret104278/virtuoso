# Virtuoso 🎹

**Virtuoso** is a refined, mobile-first piano practice assistant designed to help musicians master scales, cadences, and key signatures. Built with modern web technologies, it offers a clean, elegant interface for daily practice routines inspired by classical training (Hanon, etc.).

![Virtuoso App](public/screenshot.png)

## ✨ Features

- **Smart Scale Generation**:
  - Automatically generates **Major**, **Harmonic Minor**, and **Melodic Minor** scales.
  - Displays scales consistently with 1 bar ascending and 1 bar descending (16th notes).
  - Intelligent accidental handling based on key signatures.

- **Classical Cadences**:
  - Automatically generates a stylistic **I - IV - I6/4 - V7 - I** cadence for every key.
  - Voicings are carefully crafted (using specific semitone offsets) to ensure smooth voice leading.
  - Notated in a 3-bar structure (Quarter notes + Final Half note).

- **Circle of Fifths Navigation**:
  - Traverse keys logically using the **Circle of Fifths**.
  - Strict adherence to classical theory (e.g., preference for flat keys like Bb, Eb, Ab, Db).
  - Interactive "Next/Previous Fifth" controls.

- **Mobile-First Experience**:
  - Designed for ease of use on smartphones and tablets (iPad/iPhone).
  - Large, touch-friendly touch targets.
  - Responsive sheet music rendering (split systems for readability).

- **Elegant Design**:
  - Minimalist aesthetic using `shadcn/ui`.
  - Serif typography for a premium, classical feel.
  - Dynamic SVG sheet music rendering via `abcjs`.

## 🛠️ Tech Stack

- **Framework**: [TanStack Start](https://tanstack.com/start) (React)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Sheet Music**: [abcjs](https://paulrosen.github.io/abcjs/)
- **Icons**: [Lucide React](https://lucide.dev)
- **Tooling**: [Vite](https://vitejs.dev), [pnpm](https://pnpm.io)

## 🚀 Getting Started

### Prerequisites

- Node.js (v18+)
- pnpm

### Installation

1.  Clone the repository:

    ```bash
    git clone https://github.com/secret104278/virtuoso.git
    cd virtuoso
    ```

2.  Install dependencies:

    ```bash
    pnpm install
    ```

3.  Start the development server:

    ```bash
    pnpm dev
    ```

4.  Open your browser at `http://localhost:3000`.

## 🎼 Music Theory Implementation

The core logic resides in `src/lib/music-theory.ts`. It includes:

- **`CIRCLE_OF_FIFTHS`**: A definitive array defining the user-preferred cycle order.
- **`generateGrandStaffABC`**: Converts theoretical scale/chord data into ABC notation strings for rendering.
- **`getNoteFromSemitone`**: Smart enharmonic spelling based on context (flat vs. sharp preference).
