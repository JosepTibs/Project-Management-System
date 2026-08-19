<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a project in the project management system.
 * Projects contain work items, milestones, groups, and team members.
 */
class projects extends Model
{
    //
    use LogsActivity;

    /**
     * The attributes that are mass assignable.
     */
        protected $fillable = [
        'name',
        'created_by',
        'description',
        'item_prefix',
        'start_date',
        'end_date',
        'status_id',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the project members.
     */
    public function members(): HasMany
    {
        return $this->hasMany(project_members::class, 'project_id');
    }

    /**
     * Get the work items associated with this project.
     */
    public function workItems(): HasMany
    {
        return $this->hasMany(work_item::class, 'project_id');
    }

    /**
     * Get the work item groups associated with this project.
     */
    public function workItemGroups(): HasMany
    {
        return $this->hasMany(work_item_groups::class, 'project_id');
    }

    /**
     * Get the milestones associated with this project.
     */
    public function milestones(): HasMany
    {
        return $this->hasMany(milestones::class, 'project_id');
    }

    /**
     * Get the user who created this project.
     */
    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Get the current lifecycle status of this project.
     */
    public function status(): BelongsTo
    {
        return $this->belongsTo(project_statuses::class, 'status_id');
    }

    /**
     * Get the configurable lifecycle statuses for this project.
     */
    public function statuses(): HasMany
    {
        return $this->hasMany(project_statuses::class, 'project_id');
    }

    /**
     * Get the completion percentage for this project.
     *
     * Computed attribute based on average progress of all work items.
     */
    protected function completionPercentage(): Attribute
    {
        return Attribute::make(
            get: fn () => round($this->workItems()->avg('progress') ?? 0, 2),
            set: fn ($value) => $value,
        );
    }
}
