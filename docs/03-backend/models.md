# Eloquent Models

## Model Overview

All models are located in `app/Models/`. The system uses Laravel's Eloquent ORM with the following conventions:

- **Table names**: Snake case plural (e.g., `work_items`, `project_members`)
- **Primary keys**: Auto-incrementing `id` (except `notifications` which uses UUID)
- **Timestamps**: `created_at` and `updated_at` on all tables
- **Soft deletes**: Not currently used

## Models List

### `User` (`app/Models/User.php`)
- **Table**: `users`
- **Traits**: `HasFactory`, `Notifiable`, `LogsActivity`
- **Fillable**: `username`, `fname`, `mname`, `lname`, `sname`, `email`, `password`
- **Hidden**: `password`, `remember_token`
- **Appended**: `name` (computed full name)
- **Casts**: `email_verified_at` → datetime, `password` → hashed

**Relationships:**
- `roles()` — MorphToMany via `model_has_roles`
- `notificationSettings()` — HasOne (with defaults)
- `notifications()` — MorphMany (ordered by `created_at` desc)

**Accessors:**
- `getNameAttribute()` — Concatenates `fname mname lname sname`, filtering empty parts. Falls back to `username`.

### `projects` (`app/Models/projects.php`)
- **Table**: `projects`
- **Traits**: `LogsActivity`
- **Fillable**: `name`, `created_by`, `description`, `item_prefix`

**Relationships:**
- `members()` — HasMany to `project_members`
- `workItems()` — HasMany to `work_item`
- `workItemGroups()` — HasMany to `work_item_groups`
- `milestones()` — HasMany to `milestones`
- `creator()` — BelongsTo to `User` (via `created_by`)

**Computed Attributes:**
- `completion_percentage` — Returns the average `progress` across all work items (rounded to 2 decimals).

### `work_item` (`app/Models/work_item.php`)
- **Table**: `work_items`
- **Traits**: `LogsActivity`
- **Fillable**: `project_id`, `status_id`, `group_id`, `title`, `description`, `assignee_id`, `priority`, `due_date`, `progress`
- **Casts**: `start_date` → date, `due_date` → date, `progress` → integer

**Relationships:**
- `project()` — BelongsTo to `projects`
- `status()` — BelongsTo to `work_item_statuses`
- `group()` — BelongsTo to `work_item_groups`
- `assignee()` — BelongsTo to `User`
- `comments()` — MorphMany to `comments`

### `comments` (`app/Models/comments.php`)
- **Table**: `comments`
- **Traits**: `LogsActivity`
- **Fillable**: `commentable_type`, `commentable_id`, `user_id`, `parent_id`, `body`

**Relationships:**
- `user()` — BelongsTo to `User`
- `commentable()` — MorphTo (allows comments on any model)
- `replies()` — HasMany to self (for threaded replies)
- `parent()` — BelongsTo to self

### `activity_logs` (`app/Models/activity_logs.php`)
- **Table**: `activity_logs`
- **Fillable**: `user_id`, `subject_type`, `subject_id`, `event`, `description`, `ip_address`, `user_agent`, `properties`
- **Casts**: `properties` → array (JSON)

### `Notification` (`app/Models/Notification.php`)
- **Table**: `notifications`
- **Primary Key**: `id` (UUID string)
- **Fillable**: `type`, `notifiable_type`, `notifiable_id`, `data`, `read_at`
- **Casts**: `data` → array, `read_at` → datetime

### `NotificationSetting` (`app/Models/NotificationSetting.php`)
- **Table**: `notification_settings`
- **Fillable**: `user_id`, `work_item_assigned`, `status_changed`, `comment_added`, `reminder_days_before`
- **Casts**: All boolean fields → boolean, `reminder_days_before` → integer

### `roles` (`app/Models/roles.php`)
- **Table**: `roles`
- **Fillable**: `name`, `guard_name`

### `permissions` (`app/Models/permissions.php`)
- **Table**: `permissions`
- **Fillable**: `name`, `guard_name`

### `work_item_groups` (`app/Models/work_item_groups.php`)
- **Table**: `work_item_groups`
- **Fillable**: `project_id`, `name`, `order`

### `work_item_statuses` (`app/Models/work_item_statuses.php`)
- **Table**: `work_item_statuses`
- **Fillable**: `project_id`, `name`, `color`, `order`

### `project_members` (`app/Models/project_members.php`)
- **Table**: `project_members`
- **Fillable**: `project_id`, `user_id`, `role`

### `milestones` (`app/Models/milestones.php`)
- **Table**: `milestones`
- **Fillable**: `project_id`, `name`, `due_date`
- **Casts**: `due_date` → date

### `LoginActivity` (`app/Models/LoginActivity.php`)
- **Table**: `login_activities`
- **Fillable**: `user_id`, `ip_address`, `user_agent`, `login_at`

### `model_has_roles` (`app/Models/model_has_roles.php`)
- **Table**: `model_has_roles`
- **Note**: Polymorphic pivot table (no standard fillable/timestamps)

### `role_has_permissions` (`app/Models/role_has_permissions.php`)
- **Table**: `role_has_permissions`
- **Note**: Pivot table (no standard fillable/timestamps)

## Trait: `LogsActivity`

Applied to models that need change tracking. See [activity-logging.md](./activity-logging.md) for details.

## Naming Convention Note

Model files use snake_case (e.g., `work_item.php`, `activity_logs.php`) rather than the Laravel convention of PascalCase. This is an existing project convention that should be followed when adding new models.