<?php

namespace App\Listeners;

use App\Events\WorkItemAssignedEvent;
use App\Notifications\WorkItemAssigned;

class SendWorkItemAssignedNotification
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
     * Sends a notification to the assignee if they have work item
     * assignment notifications enabled in their settings.
     */
    public function handle(WorkItemAssignedEvent $event): void
    {
        //
        $settings = $event->assignee->notificationSettings;

        if ($settings && $settings->work_item_assigned) {
            $event->assignee->notify(new WorkItemAssigned($event->workItem, $event->actorName));
        }
    }
}
