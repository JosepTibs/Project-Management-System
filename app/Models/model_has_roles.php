<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class model_has_roles extends Model
{
    protected $fillable = [
        'role_id',
        'model_type',
        'model_id',
    ];
}