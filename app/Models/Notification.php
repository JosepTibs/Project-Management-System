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
            default => 'Notification',
        };
    }
}
