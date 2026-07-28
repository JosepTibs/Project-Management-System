<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;


class activity_logs extends Model
{
    //
    protected $fillable = [
        'user_id',
        'subject_id',
        'subject_type',
        'event',
        'description',
        'ip_address',
        'user_agent',
        'properties',
        'created_at',
    ];
    protected $casts = [
        'created_at'=>'datetime',
        'properties'=> 'array',
    ];

    public $timestamps = false;

    public function user(): BelongsTo
    {
    return $this->belongsTo(User::class);
    }

    public function subject()
    {

        return $this->MorphTo();
    }
}
