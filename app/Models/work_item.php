<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Casts\Attribute;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
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
        'milestone_id',
        'title',
        'description',
        'assignee_id',
        'priority',
        'start_date',
        'due_date',
        'progress',
        'completed_at',
        'archived_at',
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
            'completed_at' => 'datetime',
            'archived_at' => 'datetime',
        ];
    }

    /**
     * Bootstrap the model and register the completion timestamp autocast hook.
     *
     * Keeps `progress` as the single source of truth: whenever an item is
     * persisted at 100% completion, `completed_at` is (re)stamped; whenever it
     * drops back below 100%, the stamp is cleared. This prevents the two
     * attributes from drifting apart across the various progress update paths.
     *
     * @return void
     */
    protected static function boot(): void
    {
        parent::boot();

        static::saving(function (work_item $model) {
            $model->syncCompletionTimestamp();
        });

        static::saved(function (work_item $model) {
            $model->syncParentGroupProgress();
        });

        static::deleted(function (work_item $model) {
            $model->syncParentGroupProgress();
        });
    }

    /**
     * Derive the completion timestamp from the current progress value.
     *
     * @return void
     */
    protected function syncCompletionTimestamp(): void
    {
        $wasComplete = (int) ($this->getRawOriginal('progress') ?? 0) === 100;
        $nowComplete = (int) $this->progress === 100;

        if ($nowComplete && ! $wasComplete) {
            $this->completed_at = now();
        } elseif (! $nowComplete) {
            $this->completed_at = null;
        }
    }

    /**
     * Recalculate the parent group's progress after this item changes.
     *
     * Keeps group progress consistent across every update path (forms, bulk
     * progress, gantt moves). When a group has work items its progress is the
     * average of them; when it has none the manual value is left untouched.
     *
     * @return void
     */
    protected function syncParentGroupProgress(): void
    {
        $groupId = $this->group_id ?? $this->getRawOriginal('group_id');

        if (! $groupId) {
            return;
        }

        $average = work_item::query()
            ->where('group_id', $groupId)
            ->avg('progress');

        // Query-builder update: skips model events and activity logging noise.
        work_item_groups::whereKey($groupId)->update([
            'progress' => (int) round((float) $average),
        ]);
    }

    /**
     * Scope query to only archived work items.
     */
    public function scopeArchived($query)
    {
        return $query->whereNotNull('archived_at');
    }

    /**
     * Scope query to only active (non-archived) work items.
     */
    public function scopeNotArchived($query)
    {
        return $query->whereNull('archived_at');
    }

    /**
     * Determine whether this work item may be archived.
     *
     * An item can be archived once it is fully complete. Because completed_at
     * is the authoritative marker for completion (kept in sync with progress),
     * it is used as the source of truth here.
     */
    public function isArchiveable(): bool
    {
        return $this->archived_at === null && $this->completed_at !== null;
    }

    /**
     * Archive this work item (reversible).
     */
    public function archive(): void
    {
        $this->update(['archived_at' => now()]);
    }

    /**
     * Restore this work item from the archive.
     */
    public function unarchive(): void
    {
        $this->update(['archived_at' => null]);
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
     * Get the milestone that the work item belongs to (ungrouped items).
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(milestones::class, 'milestone_id');
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

    public function predecessors(): BelongsToMany
    {
        return $this->belongsToMany(work_item::class, 'dependencies', 'successor_id', 'predecessor_id')->withPivot(['type', 'lag'])->withTimestamps();
    }
    public function successors(): BelongsToMany
    {
        return $this->belongsToMany(work_item::class, 'dependencies', 'predecessor_id', 'successor_id')->withPivot(['type', 'lag'])->withTimestamps();
    }

    /**
     * Get a list of unmet dependency gates for this work item.
     *
     * Dependencies are type-aware:
     *  - finish_to_start / start_to_start   gate when this item may be STARTED
     *  - start_to_finish  / finish_to_finish gate when this item may be FINISHED (Done)
     *
     * @return array{start: string[], finish: string[]} lists of unmet labels
     */
    public function dependencyGates(): array
    {
        $start = [];
        $finish = [];

        foreach ($this->predecessors()->withPivot(['type', 'lag'])->get() as $predecessor) {
            $type = $predecessor->pivot->type;
            $lag = (int) $predecessor->pivot->lag;
            $state = (int) $predecessor->progress;
            $label = "{$predecessor->title} ({$type}, +{$lag}d)";

            switch ($type) {
                case 'finish_to_start':
                    if ($state !== 100) {
                        $start[] = $label;
                    }
                    break;

                case 'start_to_start':
                    if ($state === 0) {
                        $start[] = $label;
                    }
                    break;

                case 'start_to_finish':
                    if ($state === 0) {
                        $finish[] = $label;
                    }
                    break;

                case 'finish_to_finish':
                    if ($state !== 100) {
                        $finish[] = $label;
                    }
                    break;
            }
        }

        return ['start' => array_values(array_unique($start)), 'finish' => array_values(array_unique($finish))];
    }

    /**
     * Determine whether this item is blocked from being started.
     */
    public function isStartBlocked(): bool
    {
        return count($this->dependencyGates()['start']) > 0;
    }

    /**
     * Determine whether this item is blocked from being finished.
     */
    public function isFinishBlocked(): bool
    {
        return count($this->dependencyGates()['finish']) > 0;
    }

    public function durationInDays(): Attribute
    {
        return Attribute::make(
            get: fn() => $this->start_date && $this->due_date ? max(0, $this->start_date->diffInDays($this->due_date)): null,

            
        );
    }

    public function tags(): BelongsToMany
    {
        return $this->belongsToMany(tags::class, 'work_item_tags', 'work_item_id', 'tag_id')->withTimestamps();
    }

    public function collaborators(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'work_item_collaborators', 'work_item_id', 'user_id')->withTimestamps();
    }
}

