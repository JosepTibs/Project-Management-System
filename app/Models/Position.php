<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Position extends Model
{
    protected $fillable = ['name'];

    /**
     * Get the users with this position.
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }
}
