<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class work_item extends Model
{
    //
    protected $fillable = [
        "project_id",
        "status_id",
        "group_id",
        "title",
        "description",
        "assignee_id",
        "priority",
        "due_date",
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
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
}
