<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a group of work items within a project.
 * Groups organize work items and can be associated with milestones.
 */
class work_item_groups extends Model
{
    //
    use LogsActivity;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'milestone_id',
        'name',
        'description',
        'start_date',
        'end_date',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    /**
     * Get the milestone that owns this group.
     */
    public function milestone(): BelongsTo
    {
        return $this->belongsTo(milestones::class, 'milestone_id');
    }

    /**
     * Get the work items associated with this group.
     */
    public function workItems(): HasMany
    {
        return $this->hasMany(work_item::class, 'group_id');
    }
}
