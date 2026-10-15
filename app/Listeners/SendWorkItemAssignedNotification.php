<?php

namespace App\Listeners;

use App\Events\WorkItemAssignedEvent;
use App\Mail\WorkItemAssignedMail;
use App\Notifications\WorkItemAssigned;
use Illuminate\Support\Facades\Mail;

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

            // Member transactional email via Gmail SMTP (queued, respects same flag).
            Mail::to($event->assignee->email)->queue(
                new WorkItemAssignedMail($event->workItem, $event->actorName, $event->assignee->name)
            );
        }
    }
}
