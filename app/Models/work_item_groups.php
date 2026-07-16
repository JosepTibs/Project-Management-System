<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class work_item_groups extends Model
{
    //
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
}
