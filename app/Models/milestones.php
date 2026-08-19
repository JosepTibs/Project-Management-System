<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;

/**
 * Represents a milestone within a project.
 * Milestones group work item groups and track project progress.
 */
class milestones extends Model
{
    //
    use LogsActivity;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'name',
        'description',
        'start_date',
        'target_date',
        'completed_at',
        'order',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'target_date' => 'date',
            'completed_at' => 'date',
        ];
    }

    /**
     * Get the project that owns this milestone.
     */
    public function projects()
    {
        return $this->belongsTo(projects::class);
    }

    /**
     * Get the work item groups associated with this milestone.
     */
    public function work_item_groups()
    {
        return $this->hasMany(work_item_groups::class, 'milestone_id');
    }

    /**
     * Get all work items through work item groups.
     *
     * Uses hasManyThrough to access work items via work_item_groups.
     */
    public function workItems()
    {
        return $this->hasManyThrough(
            work_item::class,
            work_item_groups::class,
            'milestone_id', // Foreign key on work_item_groups table
            'group_id', // Foreign key on work_items table
            'id', // Local key on milestones table
            'id' // Local key on work_item_groups table
        );
    }

    /**
     * Get the completion percentage for this milestone.
     *
     * Computed attribute based on average progress of all work items.
     */
    protected function completionPercentage(): Attribute
    {
        return Attribute::make(
            get: fn () => round($this->attributes['work_items_avg_progress'] ?? $this->workItems()->avg('progress') ?? 0, 2),
        );
    }
}
