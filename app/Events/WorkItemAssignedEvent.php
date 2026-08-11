<?php

namespace App\Events;

use App\Models\User;
use App\Models\work_item;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkItemAssignedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    /**
     * Create a new event instance.
     */
    public $workItem;

    /**
     * The user who was assigned to the work item.
     */
    public $assignee;

    /**
     * The name of the user who performed the assignment.
     */
    public $actorName;

    public function __construct(work_item $workItem, User $assignee, string $actorName)
    {
        //
        $this->workItem = $workItem;
        $this->assignee = $assignee;
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
            'message' => "{$this->actorName} assigned '{$this->workItem->title}' to {$this->assignee->name}",
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'project_name' => $this->workItem->project?->name ?? 'Unknown',
            'url' => "/projects/{$this->workItem->project_id}/work-items/{$this->workItem->id}",
            'type' => 'work_item_assigned',
            'actor_name' => $this->actorName,
            'assignee_name' => $this->assignee->name,
        ];
    }
}
