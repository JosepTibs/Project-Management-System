<?php

namespace App\Notifications;

use App\Models\User;
use App\Models\work_item;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class CommentAdded extends Notification
{
    use Queueable;

    /**
     * Create a new notification instance.
     */
    protected $workItem;
    protected $commenter;
    protected $commentPreview;
    public function __construct(work_item $workItem, User $commenter, string $commentPreview)
    {
        //
        $this->workItem = $workItem;
        $this->commenter = $commenter;
        $this->commentPreview = $commentPreview;
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
     * Get the mail representation of the notification.
     */
    public function toDatabase( $notifiable): array
    {
        return [
            'message' => "{$this->commenter->name} commented on '{$this->workItem->title}'",
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'project_name' => $this->workItem->project?->name ?? 'Unknown',
            'url' => "/projects/{$this->workItem->project_id}/work-items/{$this->workItem->id}",
            'type' => 'comment_added',
            'actor_name' => $this->commenter->name,
            'comment_preview' => $this->commentPreview,
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
