<?php

use App\Http\Controllers\ActivityLogsController;
use App\Http\Controllers\CommentsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileAttachmentController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectsController;
use App\Http\Controllers\ProjectSetupController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkItemController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('activity-logs', [ActivityLogsController::class, 'index'])->name('activity-logs.index');

    Route::resource('users', UserController::class);
    Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');

    Route::resource('projects', ProjectsController::class);
    Route::resource('projects.work-items', WorkItemController::class);
    Route::get('projects/{project}/kanban', [ProjectsController::class, 'kanban'])->name('projects.kanban');
    Route::get('work-items', [WorkItemController::class, 'globalIndex'])->name('work-items.global');
    Route::patch('projects/{project}/work-items/bulk-progress', [WorkItemController::class, 'bulkUpdateProgress'])->name('work-items.bulk-progress');
    Route::patch('work-items/{workItem}/status', [WorkItemController::class, 'updateStatus'])->name('work-items.status.update');

    Route::get('projects/{project}/groups', [ProjectSetupController::class, 'groupsIndex'])->name('projects.groups.index');
    Route::get('projects/{project}/setup', [ProjectSetupController::class, 'show'])->name('projects.setup.show');
    Route::put('projects/{project}/setup', [ProjectSetupController::class, 'update'])->name('projects.setup.update');
    Route::get('work-items/{workItem}/comments', [CommentsController::class, 'index'])->name('work-items.comments.index');
    Route::post('work-items/{workItem}/comments', [CommentsController::class, 'store'])->name('work-items.comments.store');

    Route::post('comments/{comment}/reply', [CommentsController::class, 'reply'])->name('comments.reply');
    Route::patch('comments/{comment}', [CommentsController::class, 'update'])->name('comments.update');
    Route::delete('comments/{comment}', [CommentsController::class, 'destroy'])->name('comments.destroy');

    // File Attachments
    Route::post('work-items/{workItem}/attachments', [FileAttachmentController::class, 'storeToWorkItem'])->name('work-items.attachments.store');
    Route::post('comments/{comment}/attachments', [FileAttachmentController::class, 'storeToComment'])->name('comments.attachments.store');
    Route::get('attachments/{attachment}/download', [FileAttachmentController::class, 'download'])->name('attachments.download');
    Route::delete('attachments/{attachment}', [FileAttachmentController::class, 'destroy'])->name('attachments.destroy');

    // Notifications
    Route::get('/notifications', [NotificationController::class, 'index'])->name('notifications.index');
    Route::get('/api/notifications/recent', [NotificationController::class, 'getRecent']);
    Route::get('/api/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::post('/api/notifications/{notification}/read', [NotificationController::class, 'markAsRead']);
    Route::post('/api/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::get('/api/notification-settings', [NotificationController::class, 'getSettings']);
    Route::put('/api/notification-settings', [NotificationController::class, 'updateSettings']);
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
