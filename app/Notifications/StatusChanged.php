<?php

namespace App\Notifications;

use App\Models\work_item;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class StatusChanged extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    protected $workItem;
    protected $oldStatus;
    protected $newStatus;
    protected $actorName;

    public function __construct(work_item $workItem, string $oldStatus, string $newStatus, string $actorName)
    {
        $this->workItem = $workItem;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->actorName = $actorName;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "{$this->actorName} changed status of '{$this->workItem->title}' from {$this->oldStatus} to {$this->newStatus}",
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'project_name' => $this->workItem->project?->name ?? 'Unknown',
            'url' => "/projects/{$this->workItem->project_id}/work-items/{$this->workItem->id}",
            'type' => 'status_changed',
            'actor_name' => $this->actorName,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}