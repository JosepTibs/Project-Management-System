<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a status for work items within a project.
 * Statuses define workflow stages (e.g., To Do, In Progress, Done)
 * and control the order they appear in kanban boards.
 */
class work_item_statuses extends Model
{
    //
    use LogsActivity;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'name',
        'order',
        'color',
    ];

    /**
     * Get the work items associated with this status.
     */
    public function workItems(): HasMany
    {
        return $this->hasMany(work_item::class, 'status_id');
    }
}
