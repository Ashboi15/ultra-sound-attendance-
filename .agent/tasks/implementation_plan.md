# Implementation Plan - DuoSound Attendance

An ultrasonic "Data-over-Sound" attendance system.

## 1. Technologies
- **Framework**: React (Vite)
- **Styling**: Vanilla CSS (Variables, Flex/Grid, Glassmorphism)
- **Animation**: Framer Motion
- **Audio**: Web Audio API (Native)
- **Icons**: Lucide React

## 2. Architecture
- **Teacher Mode (Transmitter)**:
  - Generates a specific high-frequency tone (e.g., 20kHz).
  - Visualizes the "bloadcast" with rippling animations.
- **Student Mode (Receiver)**:
  - Analyzes audio spectrum using `AnalyserNode`.
  - Detects energy spike at the target frequency (20kHz).
  - If signal is sustained for >2 seconds -> Mark Present.

## 3. Design System (CSS)
- **Theme**: "Cyber-Security" / "Future Tech".
- **Colors**:
  - Background: Deep Void (`#050510`)
  - Accent: Neon Cyan (`#00f3ff`)
  - Success: Matrix Green (`#0aff0a`)
  - Error: Reactor Red (`#ff003c`)
- **Typography**: Inter / Roboto (System fonts).

## 4. Work Items
1.  **Dependencies**: Install `framer-motion`, `lucide-react`.
2.  **Foundation**: Setup `index.css` with CSS Variables.
3.  **Hook**: Create `useAudioTransmitter` and `useAudioReceiver`.
4.  **Components**:
    - `RoleSelection`: Landing screen.
    - `TeacherDashboard`: Controls & Pulse Animation.
    - `StudentDashboard`: Listening visualizer & Status.
5.  **Integration**: Combine in `App.jsx`.
