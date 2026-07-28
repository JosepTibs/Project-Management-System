<?php

namespace App\Listeners;

use App\Events\WorkItemStatusChangedEvent;
use App\Notifications\StatusChanged;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

class SendStatusChangeNotification
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
    public function handle(WorkItemStatusChangedEvent $event): void
    {
        if ($event->workItem->assignee) {
            $settings = $event->workItem->assignee->notificationSettings;

            if ($settings && $settings->status_changed) {
                $event->workItem->assignee->notify(
                    new StatusChanged($event->workItem, $event->oldStatus, $event->newStatus, $event->actorName)
                );
            }
        }
    }
}