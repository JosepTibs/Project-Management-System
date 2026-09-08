<?php

namespace App\Events;

use App\Models\work_item;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class WorkItemCompletedEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $workItem;
    public $actorName;

    public function __construct(work_item $workItem, string $actorName)
    {
        $this->workItem = $workItem;
        $this->actorName = $actorName;
    }

    public function broadcastOn(): array
    {
        return [
            new PrivateChannel('project.' . $this->workItem->project_id),
        ];
    }

    public function broadcastWith(): array
    {
        return [
            'message' => "'{$this->workItem->title}' has been completed by {$this->actorName}",
            'work_item_id' => $this->workItem->id,
            'project_id' => $this->workItem->project_id,
            'type' => 'work_item_completed',
        ];
    }
}
