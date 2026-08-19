# Database Schema

## Entity Relationship Overview

```
users ──┬── project_members ──── projects
        │                          │
        ├── model_has_roles ──── roles ─── role_has_permissions ──── permissions
        │                          │
        ├── activity_logs          ├── work_item_groups
        │                          ├── work_item_statuses
        ├── login_activities       ├── milestones
        │                          └── work_items ──── comments (polymorphic)
        ├── notifications
        └── notification_settings
```

## Tables

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | Auto-increment |
| username | string, unique | Login identifier |
| fname | string, nullable | First name |
| mname | string, nullable | Middle name |
| lname | string, nullable | Last name |
| sname | string, nullable | Suffix name |
| email | string, unique | Email address |
| email_verified_at | timestamp, nullable | |
| password | string | Hashed |
| remember_token | string, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

**Accessor**: `name` — concatenates `fname mname lname sname` (space-separated, filtering nulls). Falls back to `username`.

### `roles`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| name | string | Role name (e.g., "admin", "manager") |
| guard_name | string | Typically "web" |
| created_at | timestamp | |
| updated_at | timestamp | |

### `permissions`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| name | string | Permission name (e.g., "create-projects") |
| guard_name | string | Typically "web" |
| created_at | timestamp | |
| updated_at | timestamp | |

### `model_has_roles` (Polymorphic Pivot)
| Column | Type | Notes |
|--------|------|-------|
| role_id | bigint, FK → roles | |
| model_type | string | Morphable model class |
| model_id | bigint, FK | Morphable model ID |

**Primary Key**: Composite of all three columns.

### `role_has_permissions` (Pivot)
| Column | Type | Notes |
|--------|------|-------|
| permission_id | bigint, FK → permissions | |
| role_id | bigint, FK → roles | |

**Primary Key**: Composite of both columns.

### `projects`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| name | string | Project name |
| description | text, nullable | |
| created_by | bigint, FK → users | Project creator |
| item_prefix | string, nullable | Prefix for work item IDs |
| start_date | date, nullable | Project start date |
| end_date | date, nullable | Project end date |
| created_at | timestamp | |
| updated_at | timestamp | |

**Computed Attribute**: `completion_percentage` — average `progress` across all work items.

### `project_members`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| project_id | bigint, FK → projects | |
| user_id | bigint, FK → users | |
| role | string, nullable | Member's role within project |
| created_at | timestamp | |
| updated_at | timestamp | |

### `milestones`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| project_id | bigint, FK → projects | |
| name | string | Milestone name |
| due_date | date, nullable | |
| created_at | timestamp | |
| updated_at | timestamp | |

### `work_item_groups`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| project_id | bigint, FK → projects | |
| name | string | Group name (e.g., "Sprint 1", "Backlog") |
| order | integer, nullable | Display order |
| created_at | timestamp | |
| updated_at | timestamp | |

### `work_item_statuses`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| project_id | bigint, FK → projects | |
| name | string | Status name (e.g., "To Do", "In Progress", "Done") |
| color | string, nullable | Hex color for UI display |
| order | integer, nullable | Display order |
| created_at | timestamp | |
| updated_at | timestamp | |

### `work_items`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| project_id | bigint, FK → projects | |
| status_id | bigint, FK → work_item_statuses | Current status |
| group_id | bigint, FK → work_item_groups, nullable | Group assignment |
| title | string | Work item title |
| description | text, nullable | Detailed description |
| assignee_id | bigint, FK → users, nullable | Assigned user |
| priority | string, nullable | e.g., "low", "medium", "high", "critical" |
| start_date | date, nullable | |
| due_date | date, nullable | |
| progress | integer, default 0 | 0–100 percentage |
| created_at | timestamp | |
| updated_at | timestamp | |

**Casts**: `start_date` → date, `due_date` → date, `progress` → integer.

### `comments` (Polymorphic)
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| commentable_type | string | Morphable model class (e.g., `work_item`) |
| commentable_id | bigint, FK | Morphable model ID |
| user_id | bigint, FK → users | Comment author |
| parent_id | bigint, FK → comments, nullable | For threaded replies |
| body | text | Comment content |
| created_at | timestamp | |
| updated_at | timestamp | |

### `activity_logs`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| user_id | bigint, FK → users, nullable | Who performed the action |
| subject_type | string | Model class that was changed |
| subject_id | bigint, FK | ID of the changed model |
| event | string | `created`, `updated`, or `deleted` |
| description | string | Human-readable description |
| ip_address | string, nullable | Request IP |
| user_agent | text, nullable | Request user agent |
| properties | json, nullable | Changed attributes (old/new for updates) |
| created_at | timestamp | |

### `login_activities`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| user_id | bigint, FK → users | |
| ip_address | string, nullable | |
| user_agent | string, nullable | |
| login_at | timestamp | |
| created_at | timestamp | |
| updated_at | timestamp | |

### `notifications`
| Column | Type | Notes |
|--------|------|-------|
| id | uuid, PK | |
| type | string | Notification class name |
| notifiable_type | string | Morphable model class |
| notifiable_id | bigint, FK | |
| data | json | Notification payload |
| read_at | timestamp, nullable | When user read it |
| created_at | timestamp | |
| updated_at | timestamp | |

### `notification_settings`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint, PK | |
| user_id | bigint, FK → users, unique | One setting per user |
| work_item_assigned | boolean, default true | |
| status_changed | boolean, default true | |
| comment_added | boolean, default true | |
| reminder_days_before | integer, default 1 | Days before due date for reminders |
| created_at | timestamp | |
| updated_at | timestamp | |

## Key Relationships

| Model | Relationship | Related Model | Foreign Key |
|-------|-------------|---------------|-------------|
| User | hasOne | NotificationSetting | user_id |
| User | morphToMany | roles | model_has_roles |
| User | morphMany | Notification | notifiable |
| projects | hasMany | work_item | project_id |
| projects | hasMany | project_members | project_id |
| projects | hasMany | work_item_groups | project_id |
| projects | hasMany | milestones | project_id |
| projects | belongsTo | User (creator) | created_by |
| work_item | belongsTo | projects | project_id |
| work_item | belongsTo | work_item_statuses | status_id |
| work_item | belongsTo | work_item_groups | group_id |
| work_item | belongsTo | User (assignee) | assignee_id |
| work_item | morphMany | comments | commentable |
| comments | belongsTo | User | user_id |
| comments | belongsTo (self) | comments (parent) | parent_id |