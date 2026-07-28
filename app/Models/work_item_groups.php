<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\LogsActivity;
class work_item_groups extends Model
{
    //
    use LogsActivity;
    protected $fillable = [
        "project_id",
        "name",
        "description",
        "start_date",
        "end_date",
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'end_date' => 'date',
        ];
    }

    public function milestone(): BelongsTo
    {
        return $this->belongsTo(milestones::class, 'milestone_id');
    }

    public function workItems(): HasMany
    {
        return $this->hasMany(work_item::class, 'group_id');
    }
}
