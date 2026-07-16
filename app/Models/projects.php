<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

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
}
