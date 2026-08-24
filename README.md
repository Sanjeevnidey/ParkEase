# ParkEase — Automated Parking Management

A responsive, multi-page static frontend prototype for an Automated Parking Management & Slot Allocation System. It uses Tailwind CSS through its CDN and vanilla JavaScript, with realistic demo-only data.

## View locally

Open `index.html` in any modern browser. For the smoothest local experience, serve the folder with a simple static server, for example:

```bash
cd parking-management-system
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.

## Pages

- `index.html` — landing page
- `login.html` and `register.html` — demo authentication flow
- `dashboard.html` — user overview and live slot visualization
- `booking.html` — interactive demo slot selection and reservation feedback
- `history.html` — parking history
- `admin.html` — administrator dashboard

## Future Flask integration

Each page is intentionally standalone and shared UI logic lives in `assets/app.js`. Replace the demo data / form actions with Flask routes and API calls, keeping HTML templates and the shared assets structure.

## Prototype behaviour

- A booking is saved in the browser using `localStorage`, then shown in that user's parking history.
- Signing in with a different email creates/selects a different demo user, so their bookings and history stay separate.
- The booking screen switches between Levels A, B, and C, each with its own slot availability.
- A confirmed booking changes that slot to Reserved for the selected level.
- Use **Receipt** beside a history row (or **Download receipt**) to save a text receipt.
- Open `admin.html` for the separate admin panel. Its booking and revenue totals include new demo bookings.

To reset all demo users and bookings, open browser developer tools → Application/Storage → Local Storage and remove the `parkease_demo_v2` and `parkease_current_user` entries.
