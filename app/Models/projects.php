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
        'archived_at',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'start_date' => 'date',
        'end_date' => 'date',
        'archived_at' => 'datetime',
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
     * Scope query to only archived projects.
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Scope query to only active (non-archived) projects.
     */
    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Determine whether this project may be archived.
     *
     * A project can be archived only when it has no open work items and no
     * open milestones, so archived projects are never hiding active work.
     */
    public function isArchiveable(): bool
    {
        if ($this->archived_at !== null) {
            return false;
        }

        $hasOpenWorkItems = $this->workItems()
            ->whereNull('completed_at')
            ->exists();

        if ($hasOpenWorkItems) {
            return false;
        }

        return ! $this->milestones()->whereNull('completed_at')->exists();
    }

    /**
     * Archive this project and cascade the archive to all of its work items.
     *
     * Cascading ensures a project's tasks remain consistent once their parent
     * is archived. Restoring the project does not automatically restore its
     * work items; those are restored individually.
     */
    public function archive(): void
    {
        $this->update(['archived_at' => now()]);

        $this->workItems()->update(['archived_at' => now()]);
    }

    /**
     * Restore this project from the archive.
     */
    public function unarchive(): void
    {
        $this->update(['archived_at' => null]);
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
