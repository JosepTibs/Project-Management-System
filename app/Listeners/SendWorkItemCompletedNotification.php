<?php

namespace App\Listeners;

use App\Events\WorkItemCompletedEvent;
use App\Mail\WorkItemCompletedMail;
use App\Notifications\WorkItemCompleted;
use Illuminate\Support\Facades\Mail;

class SendWorkItemCompletedNotification
{
    public function handle(WorkItemCompletedEvent $event): void
    {
        $workItem = $event->workItem;

        // Notify the project manager/owner
        if ($workItem->project && $workItem->project->creator) {
            $creator = $workItem->project->creator;
            if ($creator->id !== $workItem->assignee_id) {
                $creator->notify(new WorkItemCompleted($workItem, $event->actorName));

                // Manager/owner oversight email via Gmail SMTP (queued).
                Mail::to($creator->email)->queue(
                    new WorkItemCompletedMail($workItem, $event->actorName, $creator->name)
                );
            }
        }

        // Notify the assignee (if they didn't complete it themselves)
        if ($workItem->assignee && $workItem->assignee->id !== $workItem->completed_by) {
            $workItem->assignee->notify(new WorkItemCompleted($workItem, $event->actorName));

            // Assignee completion email via Gmail SMTP (queued).
            Mail::to($workItem->assignee->email)->queue(
                new WorkItemCompletedMail($workItem, $event->actorName, $workItem->assignee->name)
            );
        }
    }
}
