<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Casts\Attribute;

class projects extends Model
{
    //
    protected $fillable =[
        "name",
        "description",
        "item_prefix",
    ];

    public function members(): HasMany
    {
        return $this->hasMany(project_members::class, 'project_id');
    }

    public function workItems(): HasMany
    {
        return $this->hasMany(work_item::class, 'project_id');
    }
    public function workItemGroups(): HasMany
    {
        return $this->hasMany(work_item_groups::class, 'project_id');
    }
    public function milestones(): HasMany
    {
        return $this->hasMany(milestones::class,'project_id');
    }
    protected function completionPercentage(): Attribute
    {
        return Attribute::make(
            get: fn () => round($this->workItems()->avg('progress') ?? 0, 2),
            set: fn ($value) => $value,
        );
    }
}
