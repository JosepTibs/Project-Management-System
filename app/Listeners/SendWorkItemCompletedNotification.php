<?php

namespace App\Listeners;

use App\Events\WorkItemCompletedEvent;
use App\Notifications\WorkItemCompleted;

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
            }
        }

        // Notify the assignee (if they didn't complete it themselves)
        if ($workItem->assignee && $workItem->assignee->id !== $workItem->completed_by) {
            $workItem->assignee->notify(new WorkItemCompleted($workItem, $event->actorName));
        }
    }
}
