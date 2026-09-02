<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class roles extends Model
{
    //
    protected $fillable = [
        "name",
        "guard_name",
    ];

    /**
     * Get the permissions granted through this role.
     */
    public function permissions()
    {
        return $this->belongsToMany(permissions::class, 'role_has_permissions', 'role_id', 'permission_id');
    }
}
