<?php

namespace App\Events;

use App\Models\work_item;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkItemStatusChangedEvent implements ShouldBroadcast
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
            new PrivateChannel('project.'.$this->workItem->project_id),
        ];
    }

    /**
     * Get the data to broadcast.
     *
     * @return array<string, mixed>
     */
    public function broadcastWith(): array
    {
        return [
            'message' => "'{$this->workItem->title}' status changed to {$this->newStatus}",
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'project_name' => $this->workItem->project?->name ?? 'Unknown',
            'url' => "/projects/{$this->workItem->project_id}/work-items/{$this->workItem->id}",
            'type' => 'status_changed',
            'actor_name' => $this->actorName,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
        ];
    }
}
