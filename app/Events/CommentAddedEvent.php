<?php

namespace App\Events;

use App\Models\User;
use App\Models\work_item;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

/**
 * Dispatched when a comment is added to a work item.
 * Notifies relevant users (assignee, original comment author).
 */
class CommentAddedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * The work item that received the comment.
     */
    public $workItem;

    /**
     * The user who added the comment.
     */
    public $commenter;

    /**
     * A preview of the comment content for notifications.
     */
    public $commentPreview;

    /**
     * The original comment author (null for top-level comments, set for replies).
     */
    public $originalCommentAuthor;

    /**
     * Create a new event instance.
     *
     * @param  work_item  $workItem  The work item receiving the comment
     * @param  User  $commenter  The user who wrote the comment
     * @param  string  $commentPreview  First 100 characters of the comment
     * @param  User|null  $originalCommentAuthor  Original comment author (for replies)
     */
    public function __construct(work_item $workItem, User $commenter, string $commentPreview, ?User $originalCommentAuthor = null)
    {
        //
        $this->workItem = $workItem;
        $this->commenter = $commenter;
        $this->commentPreview = $commentPreview;
        $this->originalCommentAuthor = $originalCommentAuthor;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, Channel>
     */
    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('channel-name'),
        ];
    }
}
