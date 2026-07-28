<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    //
    protected $fillable = [
        'user_id',
        'work_item_assigned',
        'status_changed',
        'comment_added',
        'reminder_days_before',
    ];

    protected $casts = [
        'work_item_assigned' => 'boolean',
        'status_changed' => 'boolean',
        'comment_added' => 'boolean',
        'reminder_days_before'=> 'integer',
    ];


    public function user()
    {
        return $this->belongsTo(User::class);
    }
}