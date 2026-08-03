<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;

/**
 * Represents a comment on a work item or other commentable entity.
 * Supports polymorphic relationships and nested replies.
 */
class comments extends Model
{
    //
    /**
     * The attributes that are mass assignable.
     */
    protected $fillable = [
        'commentable_type',
        'commentable_id',
        'user_id',
        'parent_id',
        'content',
    ];

    /**
     * Get the owning commentable model (polymorphic).
     *
     * Supports multiple model types (e.g., work_item, milestones).
     */
    public function commentable()
    {
        return $this->morphTo();
    }

    /**
     * Get the user who authored the comment.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Get the replies to this comment.
     */
    public function replies(): HasMany
    {
        return $this->hasMany(comments::class, 'parent_id');
    }

    /**
     * Get the parent comment (if this is a reply).
     */
    public function parent(): BelongsTo
    {
        return $this->belongsTo(comments::class, 'parent_id');
    }

    public function attachments(): MorphMany
    {
        return $this->morphMany(file_attachment::class, 'attachable');
    }
}
