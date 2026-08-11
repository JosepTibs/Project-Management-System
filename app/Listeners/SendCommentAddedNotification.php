<?php

namespace App\Listeners;

use App\Events\CommentAddedEvent;
use App\Notifications\CommentAdded;

/**
 * Listens for CommentAddedEvent and sends notifications
 * to relevant users (assignee and/or original comment author).
 */
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
     *
     * Sends database notifications to:
     * - The work item assignee (if they didn't write the comment)
     * - The original comment author (if this is a reply and they didn't reply)
     */
    public function handle(CommentAddedEvent $event): void
    {
        $notified = [];
        // Notify the assignee if they didn't write the comment themselves
        if ($event->workItem->assignee && $event->workItem->assignee->id !== $event->commenter->id) {
            // Check if the assignee has comment notifications enabled
            $settings = $event->workItem->assignee->notificationSettings;

            if ($settings && $settings->comment_added) {
                $event->workItem->assignee->notify(
                    new CommentAdded($event->workItem, $event->commenter, $event->commentPreview)
                ); $notified[] = $event->workItem->assignee->id;
            }
        }

        // Notify the original comment author if this is a reply and they didn't reply to themselves
        if ($event->originalCommentAuthor && $event->originalCommentAuthor->id !== $event->commenter->id && !in_array($event->originalCommentAuthor->id, $notified)) {
            // Check if the original author has comment notifications enabled
            $settings = $event->originalCommentAuthor->notificationSettings;

            if ($settings && $settings->comment_added) {
                $event->originalCommentAuthor->notify(
                    new CommentAdded($event->workItem, $event->commenter, $event->commentPreview)
                );
            }
        }
    }
}
