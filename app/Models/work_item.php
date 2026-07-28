<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use App\Traits\LogsActivity;
class work_item extends Model
{
    //
    use LogsActivity;
    protected $fillable = [
        "project_id",
        "status_id",
        "group_id",
        "title",
        "description",
        "assignee_id",
        "priority",
        "due_date",
        "progress",
    ];

    protected function casts(): array
    {
        return [
            'start_date'=> 'date',
            'due_date' => 'date',
            'progress'=> 'integer',
        ];
    }

    public function project(): BelongsTo
    {
        return $this->belongsTo(projects::class, 'project_id');
    }

    public function status(): BelongsTo
    {
        return $this->belongsTo(work_item_statuses::class, 'status_id');
    }

    public function group(): BelongsTo
    {
        return $this->belongsTo(work_item_groups::class, 'group_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }
    public function comments(): MorphMany
    {
        return $this->morphMany(comments::class,'commentable');
    }
}
