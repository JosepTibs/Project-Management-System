<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Casts\Attribute;

use Illuminate\Database\Eloquent\Model;

class milestones extends Model
{
    //
    protected $fillable = [
        'project_id',
        'name',
        'description',
        'start_date',
        'target_date',
        'completed_at',
        'order',
    ];
    protected function casts(): array
    {
        return [
            'start_date' => 'date',
            'target_date'=> 'date',
            'completed_at'=> 'date',
        ];
    }

    public function projects(){
    return $this->belongsTo(projects::class);
}

    public function work_item_groups(){
    return $this->hasMany(work_item_groups::class);
}

    public function workItems()
    {
        return $this->hasManyThrough(
            work_item::class,
            work_item_groups::class,
            'milestone_id', // Foreign key on work_item_groups table
            'group_id', // Foreign key on work_items table
            'id', // Local key on milestones table
            'id' // Local key on work_item_groups table
        );
    }
    protected function completionPercentage(): Attribute
    {
        return Attribute::make(
            get: fn () => round($this->attributes['work_items_avg_progress'] ?? $this->workItems()->avg('progress') ?? 0, 2),
        );
    }
}