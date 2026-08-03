# Project Management System — Documentation

This directory contains the documentation for the **Project Management System**, a full-stack web application built with Laravel 12, React 19 (Inertia v2), and Tailwind CSS v4.

## Stack Overview

| Layer        | Technology                                      |
|-------------|-------------------------------------------------|
| Backend      | PHP 8.2, Laravel 12                             |
| Frontend     | React 19, Inertia.js v2, TypeScript             |
| Styling      | Tailwind CSS v4, Radix UI primitives            |
| Real-time    | Pusher, Laravel Echo, Laravel Broadcasting      |
| Database     | SQLite (dev) / MySQL (production)               |
| Testing      | Pest PHP 3, PHPUnit 11                          |
| Build        | Vite 6, Laravel Vite Plugin                     |

## Getting Started

New here? Start with the [Architecture Design Document Guide](./06-guides/architecture-design-documents.md) to learn how to write and maintain architecture docs, then read the [Architecture Overview](./01-architecture/overview.md).

## Templates

Copy these reusable templates to start new documents:

| Template | Use for |
|----------|---------|
| [Feature Design](./00-templates/feature-design.md) | Designing a new feature end-to-end (routes, data flow, files, edge cases) |
| [ADR (Decision Record)](./00-templates/adr-template.md) | Recording a technical decision with alternatives & trade-offs |
| [Module Reference](./00-templates/module-reference.md) | Deep-diving an existing module or feature area |

## Documentation Index

| Section | Description |
|---------|-------------|
| [00-templates/](./00-templates/) | Reusable templates for feature designs, ADRs, and module references |
| [01-architecture/overview.md](./01-architecture/overview.md) | High-level architecture, data flow, and design patterns |
| [01-architecture/database-schema.md](./01-architecture/database-schema.md) | Database tables, relationships, and ERD |
| [02-setup/installation.md](./02-setup/installation.md) | Local development environment setup |
| [02-setup/deployment.md](./02-setup/deployment.md) | Production deployment guide |
| [03-backend/models.md](./03-backend/models.md) | Eloquent models, relationships, and casts |
| [03-backend/controllers.md](./03-backend/controllers.md) | Controllers and route-to-controller mapping |
| [03-backend/events-and-listeners.md](./03-backend/events-and-listeners.md) | Event-driven architecture and notification flow |
| [03-backend/notifications.md](./03-backend/notifications.md) | Notification types, channels, and settings |
| [03-backend/activity-logging.md](./03-backend/activity-logging.md) | Activity logging system (LogsActivity trait) |
| [03-backend/authorization.md](./03-backend/authorization.md) | Roles, permissions, and authorization |
| [04-frontend/pages-and-routing.md](./04-frontend/pages-and-routing.md) | Inertia page structure and route mapping |
| [04-frontend/components.md](./04-frontend/components.md) | Shared UI components and patterns |
| [04-frontend/kanban-board.md](./04-frontend/kanban-board.md) | Kanban board implementation |
| [04-frontend/gantt-chart.md](./04-frontend/gantt-chart.md) | Gantt chart implementation |
| [04-frontend/real-time.md](./04-frontend/real-time.md) | Real-time features (Pusher, Echo, polling) |
| [05-api/notification-api.md](./05-api/notification-api.md) | Notification API endpoints reference |
| [06-guides/architecture-design-documents.md](./06-guides/architecture-design-documents.md) | How to write, structure, and maintain architecture design documents |
| [06-guides/contributing.md](./06-guides/contributing.md) | How to contribute and add new features |

## Quick Links

- **Routes**: See `routes/web.php` and `routes/api.php`
- **Models**: Located in `app/Models/`
- **Controllers**: Located in `app/Http/Controllers/`
- **Frontend Pages**: Located in `resources/js/pages/`
- **Frontend Components**: Located in `resources/js/components/`
- **Events**: Located in `app/Events/`
- **Listeners**: Located in `app/Listeners/`
- **Notifications**: Located in `app/Notifications/`
- **Migrations**: Located in `database/migrations/`