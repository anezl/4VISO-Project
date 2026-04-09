# 4VISO Frontend Architecture

## Goal

Build a frontend-only MVP for 4VISO's lane-visibility product using Vue 3 and mock data, while keeping the code ready for a future backend integration.

## Chosen stack

- Vue 3 + Vite + TypeScript
- Vue Router for auth and app navigation
- Pinia for session and domain state
- Mock API layer backed by `localStorage`
- Vitest + Vue Test Utils for key logic coverage

## App structure

- `src/router`
  Route definitions and auth guards.
- `src/stores`
  Session, shipments, and workspace state.
- `src/services`
  Storage and API contract. This is the seam where a real backend can replace the mock adapter later.
- `src/mocks`
  Seed data for demo users, shipments, alerts, certifications, and notifications.
- `src/components`
  Reusable UI pieces for layout, shipment cards, route flow, status pills, and the route editor drawer.
- `src/views`
  Auth pages, shipment list, dashboard, certificates, notifications, profile, and admin surfaces.
- `src/types`
  Shared domain models and role/capability helpers.

## Data flow

1. Seed data is loaded into `localStorage` the first time the app starts.
2. `mockApi` exposes async methods that mimic backend calls.
3. Pinia stores call `mockApi` and expose reactive UI state.
4. Vue views and components render store state and trigger store actions.

## Backend-ready decisions

- All mutations go through `mockApi`, not directly through components.
- Stores do not depend on raw `localStorage`.
- Domain models are centralized in `src/types/domain.ts`.
- Route permissions are derived from user roles, so backend authorization can later align with the same policy surface.

## MVP scope

- Role-based login and registration
- Email verification mock flow
- Forgot password mock flow
- Shipment list and dashboard
- Horizontal lane flow with nodes and transport steps
- Alert and incident visibility
- Certificates and validation status
- Simple lane creation and editing for `admin` and `logistics provider`
- Desktop/tablet-first responsive layout
