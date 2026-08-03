<?php

namespace App\Notifications;

use App\Models\work_item;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class WorkItemAssigned extends Notification
{
    use Queueable;

    /**
     * The work item that was assigned.
     */
    protected $workItem;

    /**
     * The name of the user who performed the assignment.
     */
    protected $actorName;

    /**
     * Create a new notification instance.
     */
    public function __construct(work_item $workItem, string $actorName)
    {
        //
        $this->workItem = $workItem;
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
            'message' => "{$this->actorName} assigned you to '{$this->workItem->title}'",
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'project_name' => $this->workItem->project?->name ?? 'Unknown',
            'url' => "/projects/{$this->workItem->project_id}/work-items/{$this->workItem->id}",
            'type' => 'assigned',
            'actor_name' => $this->actorName,
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
