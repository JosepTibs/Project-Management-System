<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use App\Models\NotificationSetting;
use Illuminate\Http\Request;
use Inertia\Inertia;

class NotificationController extends Controller
{
    public function index(Request $request)
    {
        $filter = $request->query('filter', 'all');

        $query = auth()->user()->notifications()
            ->orderBy('created_at', 'desc');

        // Apply unread filter if requested
        if ($filter === 'unread') {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate(20);

        $notifications->getCollection()->transform(function ($notification) {
        $notification->is_unread = $notification->isUnread();
        return $notification;
    });

        return Inertia::render('notifications/index', [
            'notifications' => $notifications,
            'filter' => $filter,
            'unread_count' => auth()->user()->unreadNotifications()->count(),
        ]);
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

        return response()->json([
            'notifications' => $notifications,
            'unread_count' => auth()->user()->unreadNotifications()->count(),
        ]);
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

        return response()->json(['success' => true]);
    }

    public function getUnreadCount()
    {
        return response()->json([
            'count' => auth()->user()->unreadNotifications()->count(),
        ]);
    }

    public function getSettings()
    {
        $settings = auth()->user()->notificationSettings;

        return response()->json($settings);
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

        return response()->json(['success' => true, 'settings' => $settings]);
    }
}