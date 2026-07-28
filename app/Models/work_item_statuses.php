<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use App\Traits\LogsActivity;
class work_item_statuses extends Model
{
    //
    use LogsActivity;
    protected $fillable=[
        "project_id",
        "name",
        "order",
        "color",
    ];

    public function workItems(): HasMany
    {
        return $this->hasMany(work_item::class, 'status_id');
    }
}
