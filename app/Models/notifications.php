<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
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
        return match(class_basename($this->type)) {
            'WorkItemAssigned'=>'Assigned',
            'StatusChanged' => 'StatusUpdated',
            'DueDateReminder' => 'Due Date Reminder',
            'CommentAdded' => 'New Comment',
            default => 'Notification',
    };
}
}