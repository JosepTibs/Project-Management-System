<?php

namespace App\Events;

use App\Models\work_item;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkItemStatusChangedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    /**
     * The work item whose status changed.
     */
    public $workItem;

    /**
     * The previous status name.
     */
    public $oldStatus;

    /**
     * The new status name.
     */
    public $newStatus;

    /**
     * The name of the user who changed the status.
     */
    public $actorName;

    public function __construct(work_item $workItem, string $oldStatus, string $newStatus, string $actorName)
    {
        //
        $this->workItem = $workItem;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
        $this->actorName = $actorName;
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
