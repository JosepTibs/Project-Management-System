<?php

namespace App\Models;

use Illuminate\Notifications\DatabaseNotification;

class Notification extends DatabaseNotification
{
    //
    protected $casts = [
        'data' => 'array',
        'read_at' => 'datetime',
    ];

    public function isUnread(): bool
    {
        return $this->read_at === null;
    }

    public function getTypeLabelAttribute(): string
    {
        return match (class_basename($this->type)) {
            'WorkItemAssigned' => 'Assigned',
            'StatusChanged' => 'Status Updated',
            'DueDateReminder' => 'Due Date Reminder',
            'WorkItemCompleted' => 'Completed',
            'AdminDigest' => 'Daily Digest',
            'CommentAdded' => 'New Comment',
            'PasswordResetRequested' => 'Password Reset',
            default => 'Notification',
        };
    }

    /**
     * Stable snake_case slug for the frontend icon map. Key on this instead
     * of the PHP class name so renaming a Notification class never breaks
     * icons (see resources/js/components/notification-icon.tsx).
     */
    public function getTypeSlugAttribute(): string
    {
        return match (class_basename($this->type)) {
            'WorkItemAssigned' => 'work_item_assigned',
            'StatusChanged' => 'status_changed',
            'DueDateReminder' => 'due_date_reminder',
            'WorkItemCompleted' => 'work_item_completed',
            'AdminDigest' => 'admin_digest',
            'CommentAdded' => 'comment_added',
            'PasswordResetRequested' => 'password_reset_requested',
            default => 'notification',
        };
    }
}
