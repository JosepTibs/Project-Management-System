# Architecture Overview

## High-Level Architecture

This application follows a **monolithic SPA** architecture using Inertia.js v2. The server (Laravel) handles routing, business logic, and data persistence, while the client (React) handles rendering and interactivity — all without building a separate API layer for the web frontend.

```
┌─────────────────────────────────────────────────────────┐
│                     Browser (React SPA)                  │
│  ┌───────────┐ ┌──────────┐ ┌────────────────────────┐ │
│  │  Pages    │ │Components│ │  Real-time (Echo/Pusher)│ │
│  └─────┬─────┘ └────┬─────┘ └───────────┬────────────┘ │
│        │             │                   │              │
└────────┼─────────────┼───────────────────┼──────────────┘
         │             │                   │
         │  Inertia.js │                   │
         │  (JSON)     │                   │
         ▼             │                   │
┌──────────────────────┴───────────────────┼──────────────┐
│              Laravel Server              │              │
│  ┌──────────┐ ┌──────────┐ ┌────────────▼───────────┐  │
│  │ Routes   │ │Controllers│ │  Broadcasting (Pusher) │  │
│  └────┬─────┘ └────┬─────┘ └────────────┬───────────┘  │
│       │            │                    │              │
│       ▼            ▼                    ▼              │
│  ┌──────────────────────────────────────────────┐      │
│  │           Service Layer / Business Logic      │      │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────────┐  │      │
│  │  │ Events   │ │Listeners │ │ Notifications │  │      │
│  │  └──────────┘ └──────────┘ └──────────────┘  │      │
│  └──────────────────────┬───────────────────────┘      │
│                         │                              │
│                         ▼                              │
│  ┌──────────────────────────────────────────────┐      │
│  │              Eloquent ORM / Database          │      │
│  └──────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────┘
```

## Key Design Patterns

### 1. Inertia.js SPA Pattern
- **No Blade views** for the main application — all rendering is done via React components.
- Server-side routes return Inertia responses (`Inertia::render()`), which send JSON to the client.
- The client-side router (Inertia) swaps page components without full page reloads.
- Data is passed from controllers to pages as **props**, similar to how you'd pass data to a Blade view.

### 2. Event-Driven Notification System
- Domain events (e.g., `WorkItemStatusChangedEvent`) are dispatched when actions occur.
- **Listeners** handle these events and dispatch **Laravel Notifications**.
- Notifications are stored in the database and broadcast via **Pusher** for real-time delivery.
- Users can configure their notification preferences via `NotificationSetting` model.

### 3. Activity Logging (Trait-Based)
- The `LogsActivity` trait is applied to models that need change tracking.
- On `created`, `updated`, and `deleted` events, an `activity_logs` record is created.
- The trait captures: user, IP address, user agent, changed attributes, and a human-readable description.

### 4. Role-Based Authorization
- A polymorphic `roles` system allows users to have multiple roles.
- Permissions are assigned to roles via a many-to-many relationship.
- The `model_has_roles` pivot table links users (or other models) to roles.

## Data Flow Examples

### Creating a Work Item
```
User submits form → WorkItemController@store
  → Validates request (WorkItemRequest)
  → Creates work_item record
  → Dispatches WorkItemAssignedEvent (if assignee changed)
  → Logs activity via LogsActivity trait
  → Returns Inertia redirect to project page
```

### Status Change with Notification
```
User changes status → WorkItemController@updateStatus
  → Updates work_item.status_id
  → Dispatches WorkItemStatusChangedEvent
  → Listener: SendStatusChangeNotification
    → Checks user's notification settings
    → Creates database notification
    → Broadcasts via Pusher channel
  → React UI receives broadcast → updates notification bell
```

## Directory Structure

```
app/
├── Events/              # Domain events (dispatched on actions)
├── Http/
│   ├── Controllers/     # Web controllers (Inertia responses)
│   ├── Middleware/       # Custom middleware
│   └── Requests/        # Form request validation
├── Listeners/           # Event listeners (handle events)
├── Models/              # Eloquent models
├── Notifications/       # Laravel notification classes
├── Providers/           # Service providers
└── Traits/              # Reusable traits (e.g., LogsActivity)

resources/js/
├── components/          # Shared React components
│   ├── ui/              # Base UI primitives (Radix-based)
│   ├── kanban/          # Kanban board components
│   └── comments/        # Comment thread components
├── layouts/             # Layout components (app, auth, settings)
├── pages/               # Inertia page components
│   ├── auth/            # Login, register, etc.
│   ├── projects/        # Project CRUD pages
│   ├── work-items/      # Work item pages
│   ├── notifications/   # Notification pages
│   └── settings/        # User settings pages
├── hooks/               # Custom React hooks
├── lib/                 # Utility functions
└── types/               # TypeScript type definitions