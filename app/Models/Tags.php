<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class Tags extends Model
{
    //
    protected $fillable = [
        'project_id',
        'name',
        'color',
    
    ];

    public function workItems(): BelongsToMany
    {
        return $this->belongsToMany(work_item::class, 'work_item_tags', 'tag_id', 'work_item_id');
    }
}
