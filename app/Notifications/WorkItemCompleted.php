<?php

namespace App\Notifications;

use App\Models\work_item;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\BroadcastMessage;
use Illuminate\Notifications\Notification;

class WorkItemCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    protected $workItem;
    public $actorName;

    public function __construct( work_item $workItem, string $actorName)
    {
        //
        $this->workItem = $workItem;
        $this->actorName = $actorName;
    }

   
    public function via(object $notifiable): array
    {
        return ['database', 'broadcast'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => $this->getMessage(),
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'project_name' => $this->workItem->project?->name ?? 'Unknown',
            'url' => "/projects/{$this->workItem->project_id}/work-items/{$this->workItem->id}",
            'type' => 'work_item_completed',
            'actor_name' => $this->actorName,
        ];
    }

      public function toBroadcast($notifiable): BroadcastMessage
    {
        return new BroadcastMessage($this->toDatabase($notifiable));
    }

    protected function getMessage(): string
    {
        $title = $this->workItem->title;

        if ($this->actorName === 'system') {
            return "✅ '{$title}' has been marked as completed";
        }
        return "✅ {$this->actorName} completed '{$title}'";
    }
}
