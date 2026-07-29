# Theme Scheduling System

## Overview
The application allows users to automate theme switching to reduce eye strain and match natural light cycles.

## Modes
- **Manual**: User explicitly chooses Light, Dark, or System.
- **Custom Schedule**: User defines specific hours for theme transitions.
- **Sun Schedule**: (Default 06:00/18:00) Approximates day/night cycles based on local timezone.

## Performance & Persistence
- Schedule state is stored in `localStorage`.
- A background observer checks the time every 60 seconds to ensure the theme remains accurate if the tab is left open.

## Accessibility
- Form controls use native time inputs for screen reader compatibility.
- Transition preview strip provides visual feedback for custom intervals.
