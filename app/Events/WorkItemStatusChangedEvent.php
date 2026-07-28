<?php

namespace App\Events;

use App\Models\work_item;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkItemStatusChangedEvent
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $workItem;
    public $oldStatus;
    public $newStatus;
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
