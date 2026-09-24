<?php

namespace App\Notifications;

use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Notification;

class PasswordResetRequested extends Notification implements ShouldQueue
{
    use Queueable;

    /**
     * The user who requested the password reset.
     */
    protected $user;

    /**
     * Create a new notification instance.
     */
    public function __construct(User $user)
    {
        //
        $this->user = $user;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via($notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the database representation of the notification.
     */
    public function toDatabase($notifiable): array
    {
        return [
            'message' => "{$this->user->name} requested a password reset",
            'user_id' => $this->user->id,
            'username' => $this->user->username,
            'email' => $this->user->email,
            'url' => "/users/{$this->user->id}/edit",
            'type' => 'password_reset',
        ];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            //
        ];
    }
}
