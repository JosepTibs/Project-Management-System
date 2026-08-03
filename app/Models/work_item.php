<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Represents a work item/task within a project.
 * Tracks progress, status, priority, and relationships to users and other entities.
 */
class work_item extends Model
{
    //
    use LogsActivity;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'status_id',
        'group_id',
        'title',
        'description',
        'assignee_id',
        'priority',
        'due_date',
        'progress',
    ];

    /**
     * The attributes that should be cast to native types.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'due_date' => 'date',
            'progress' => 'integer',
        ];
    }

    /**
     * Get the project that owns the work item.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(projects::class, 'project_id');
    }

    /**
     * Get the status of the work item.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(work_item_statuses::class, 'status_id');
    }

    /**
     * Get the group that the work item belongs to.
     */
    public function group(): BelongsTo
    {
        return $this->belongsTo(work_item_groups::class, 'group_id');
    }

    /**
     * Get the user assigned to this work item.
     */
    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /**
     * Get all comments associated with this work item (polymorphic).
     */
    public function comments(): MorphMany
    {
        return $this->morphMany(comments::class, 'commentable');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(file_attachment::class, 'attachable');
    }
}
