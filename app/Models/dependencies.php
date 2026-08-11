<?php

namespace App\Models;
use App\Traits\LogsActivity; 
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class dependencies extends Model
{
    //
    protected $fillable = [
        'predecessor_id',
        'successor_id',
        'type',
        'lag',
    ];

    public function predecessor(): BelongsTo
    {
        return $this->belongsTo(work_item::class,'predecessor_id');
    }

    public function successor(): BelongsTo
    {
        return $this->belongsTo(work_item::class, 'successor_id');
    }
}


