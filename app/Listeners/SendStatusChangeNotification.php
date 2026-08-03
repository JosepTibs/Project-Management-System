<?php

namespace App\Listeners;

use App\Events\WorkItemStatusChangedEvent;
use App\Notifications\StatusChanged;

class SendStatusChangeNotification
{
    /**
     * Create the event listener.
     */
    public function __construct()
    {
        //
    }

    public function handle(WorkItemStatusChangedEvent $event): void
    {
        if ($event->workItem->assignee) {
            // Check if the assignee has status change notifications enabled
            $settings = $event->workItem->assignee->notificationSettings;

            if ($settings && $settings->status_changed) {
                $event->workItem->assignee->notify(
                    new StatusChanged($event->workItem, $event->oldStatus, $event->newStatus, $event->actorName)
                );
            }
        }
    }
}
