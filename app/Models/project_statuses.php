<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * Represents a lifecycle status for a project.
 * Statuses define the project workflow stages (e.g., Draft, Planning,
 * Approved, Active, On Hold, Completed) and can be configured per project.
 */
class project_statuses extends Model
{
    use LogsActivity;

    protected $fillable = [
        'project_id',
        'name',
        'color',
        'order',
        'is_initial',
        'is_final',
    ];

    protected $casts = [
        'is_initial' => 'boolean',
        'is_final' => 'boolean',
    ];

    /**
     * Get the project that owns this status.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(projects::class, 'project_id');
    }

    /**
     * Get the projects currently using this status.
     */
    public function projects(): HasMany
    {
        return $this->hasMany(projects::class, 'status_id');
    }
}
