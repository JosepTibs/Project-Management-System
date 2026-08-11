<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index()
    {
        $notifications = auth()->user()->notifications()
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
        ]);
    }

    public function getUnreadCount()
    {
        return [
            'count' => auth()->user()->unreadNotifications()->count(),
        ];
    }

    public function getRecent()
    {
        $notifications = auth()->user()->notifications()
            ->orderBy('created_at', 'desc')
            ->take(10)
            ->get()
            ->map(function ($notification) {
                return [
                    'id' => $notification->id,
                    'type' => class_basename($notification->type),
                    'type_label' => $notification->type_label,
                    'data' => $notification->data,
                    'read_at' => $notification->read_at,
                    'is_unread' => $notification->isUnread(),
                    'created_at' => $notification->created_at->diffForHumans(),
                ];
            });

        return [
            'notifications' => $notifications,
            'unread_count' => auth()->user()->unreadNotifications()->count(),
        ];
    }

    public function markAsRead(Notification $notification)
    {
        if ($notification->notifiable_id !== auth()->id()) {
            abort(403);
        }

        $notification->markAsRead();

        return response()->json(['success' => true]);
    }

    public function markAllAsRead()
    {
        auth()->user()->unreadNotifications->markAsRead();

        return ['success' => true];
    }

    public function getSettings()
    {
        $settings = auth()->user()->notificationSettings;

        return $settings;
    }

    public function updateSettings(Request $request)
    {
        $validated = $request->validate([
            'work_item_assigned' => 'boolean',
            'status_changed' => 'boolean',
            'comment_added' => 'boolean',
            'reminder_days_before' => 'integer|min:0|max:30',
        ]);

        $settings = auth()->user()->notificationSettings;
        $settings->update($validated);

        return ['success' => true, 'settings' => $settings];
    }
}