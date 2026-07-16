<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class work_item_statuses extends Model
{
    //
    protected $fillable=[
        "project_id",
        "name",
        "order",
    ];

    public function workItems(): HasMany
    {
        return $this->hasMany(work_item::class, 'status_id');
    }
}
