<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Tracks which users are members of which projects.
 */
class project_members extends Model
{
    //
    use LogsActivity;

    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'project_id',
        'user_id',

    ];

    /**
     * Get the project that owns this membership.
     */
    public function project(): BelongsTo
    {
        return $this->belongsTo(projects::class, 'project_id');
    }

    /**
     * Get the user associated with this membership.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Generate a human-readable description for activity logs.
     *
     * Overrides the default LogsActivity behavior to provide
     * context-specific descriptions for membership changes.
     *
     * @return string Activity description
     */
    public function getActivityDescription(string $event): string
    {
        if ($event === 'deleted') {
            // Use raw attributes directly when relationships may be broken
            $userId = $this->attributes['user_id'] ?? null;
            $projectId = $this->attributes['project_id'] ?? null;

            $user = $userId ? User::find($userId) : null;
            $project = $projectId ? projects::find($projectId) : null;
        } else {
            $user = $this->user()->first();
            $project = $this->project()->first();
        }

        $userName = $user ? $user->username : 'Unknown User';
        $projectName = $project ? $project->name : 'Unknown Project';

        return match ($event) {
            'created' => "Added {$userName} to project {$projectName}",
            'deleted' => "Removed {$userName} from project {$projectName}",
            default => "Modified {$userName} in project {$projectName}",
        };
    }
}
