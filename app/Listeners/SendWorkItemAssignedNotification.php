<?php

namespace App\Listeners;

use App\Events\WorkItemAssignedEvent;
use App\Notifications\WorkItemAssigned;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Queue\InteractsWithQueue;

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
     */
    public function handle(WorkItemAssignedEvent $event): void
    {
        //
        $settings = $event->assignee->notificationSettings;

        if($settings && $settings->work_item_assigned){
            $event->assignee->notify(new WorkItemAssigned($event->workItem, $event->actorName));
        }
    }
}
