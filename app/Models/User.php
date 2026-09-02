<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Traits\LogsActivity;
use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\MorphToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasFactory, LogsActivity, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        // 'name',
        'username',
        'fname',
        'mname',
        'lname',
        'sname',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * The accessors to append to the model's array form.
     *
     * @var list<string>
     */
    protected $appends = [
        'name',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Get the user's full name (concatenation of fname, mname, lname, sname).
     */
    public function getNameAttribute(): string
    {
        $parts = array_filter([$this->fname, $this->mname, $this->lname, $this->sname]);

        return implode(' ', $parts) ?: $this->username;
    }

    /**
     * Get the roles assigned to this user.
     */
    public function roles(): MorphToMany
    {
        return $this->morphToMany(roles::class, 'model', 'model_has_roles', 'model_id', 'role_id');
    }

    /**
     * Get the notification settings for this user.
     *
     * Returns default settings if none exist.
     */
    public function notificationSettings(): HasOne
    {
        return $this->hasOne(NotificationSetting::class)->withDefault([
            'work_item_assigned' => true,
            'status_changed' => true,
            'comment_added' => true,
            'reminder_days_before' => 1,
        ]);
    }

    /**
     * Get the notifications for this user.
     */
    public function notifications()
    {
        return $this->morphMany(Notification::class, 'notifiable')->orderBy('created_at', 'desc');
    }

    /**
     * Determine whether this user has the given role (case-insensitive).
     */
    public function hasRole(string $role): bool
    {
        return $this->roles->contains(fn ($r) => strtolower($r->name) === strtolower($role));
    }

    /**
     * Determine whether this user has the given permission through their roles.
     */
    public function hasPermission(string $permission): bool
    {
        $this->loadMissing('roles.permissions');

        return $this->roles->contains(fn ($role) => $role->permissions->contains('name', $permission));
    }

    /**
     * Whether the user can bypass dependency gating (Superadmin / Admin).
     */
    public function isWorkflowPrivileged(): bool
    {
        return $this->roles->contains(fn ($role) => in_array(strtolower($role->name), ['superadmin', 'admin']));
    }

    /**
     * Whether the user is an admin-level role (superadmin or admin) and sees
     * every project regardless of ownership.
     */
    public function isAdminLevel(): bool
    {
        return $this->roles->contains(fn ($role) => in_array(strtolower($role->name), ['superadmin', 'admin']));
    }

    /**
     * Whether the user holds a manager role (e.g. "manager" or
     * "project manager"). Managers are scoped to projects they own.
     */
    public function isManagerRole(): bool
    {
        return $this->roles->contains(fn ($role) => str_contains(strtolower($role->name), 'manager'));
    }

    /**
     * Whether the user holds the plain "member" role.
     */
    public function isMemberRole(): bool
    {
        return $this->hasRole('member');
    }

    /**
     * Whether the user may fully manage (edit/delete/archive) the given
     * project: admins always; managers only when they own it.
     */
    public function canManageProject(projects $project): bool
    {
        if ($this->isAdminLevel()) {
            return true;
        }

        return $this->isManagerRole() && (int) $project->created_by === (int) $this->id;
    }
}
