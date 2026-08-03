<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NotificationSetting extends Model
{
    //
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'user_id',
        'work_item_assigned',
        'status_changed',
        'comment_added',
        'reminder_days_before',
    ];

    /**
     * The attributes that should be cast to native types.
     */
    protected $casts = [
        'work_item_assigned' => 'boolean',
        'status_changed' => 'boolean',
        'comment_added' => 'boolean',
        'reminder_days_before' => 'integer',
    ];

    /**
     * Get the user associated with these notification settings.
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
