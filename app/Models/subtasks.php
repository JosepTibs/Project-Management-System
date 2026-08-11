<?php

namespace App\Models;

use App\Traits\LogsActivity;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class subtasks extends Model
{
    //
    protected $fillable = [
        'work_item_id',
        'assignee_id',
        'title',
        'description',
        'priority',
        'progress',
        'due_date',
        'order',
    ];

    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'progress' => 'integer',
            ];
    }
    public function workItem(): BelongsTo
    {
        return $this->belongsTo(work_item::class, 'work_item_id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(User::class,'assignee_id');
    }
}
