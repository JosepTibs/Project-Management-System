<?php

namespace App\Listeners;

use App\Events\CommentAddedEvent;
use App\Notifications\CommentAdded;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;


class SendCommentAddedNotification
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    /**
     * Handle the event.
     */
    public function handle(CommentAddedEvent $event): void
    {
        // Only notify the assignee if they didn't write the comment themselves
        if ($event->workItem->assignee && $event->workItem->assignee->id !== $event->commenter->id) {
            $settings = $event->workItem->assignee->notificationSettings;

            if ($settings && $settings->comment_added) {
                $event->workItem->assignee->notify(
                    new CommentAdded($event->workItem, $event->commenter, $event->commentPreview)
                );
            }
        }
    }
}