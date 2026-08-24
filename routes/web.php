<?php

use App\Http\Controllers\ActivityLogsController;
use App\Http\Controllers\CommentsController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\FileAttachmentController;
use App\Http\Controllers\GanttController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ProjectsController;
use App\Http\Controllers\ProjectSetupController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\WorkItemController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;



Route::redirect('/', '/login')->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('activity-logs', [ActivityLogsController::class, 'index'])->name('activity-logs.index');

    Route::resource('users', UserController::class);
    Route::get('profile', [ProfileController::class, 'show'])->name('profile.show');

    Route::resource('projects', ProjectsController::class)->except(['create']);
    Route::resource('projects.work-items', WorkItemController::class);

    // Archive / restore (non-destructive; reversible)
    Route::post('projects/{project}/archive', [ProjectsController::class, 'archive'])->name('projects.archive');
    Route::post('projects/{project}/restore', [ProjectsController::class, 'unarchive'])->name('projects.restore');
    Route::post('work-items/{workItem}/archive', [WorkItemController::class, 'archive'])->name('work-items.archive');
    Route::post('work-items/{workItem}/restore', [WorkItemController::class, 'unarchive'])->name('work-items.restore');

    Route::get('projects/{project}/kanban', [ProjectsController::class, 'kanban'])->name('projects.kanban');
    Route::get('projects/{project}/gantt', [GanttController::class, 'index'])->name('projects.gantt');

    // Gantt Chart API Endpoints
    Route::patch('projects/{project}/work-items/{workItem}/resize', [GanttController::class, 'resize'])->name('projects.gantt.resize');
    Route::patch('projects/{project}/work-items/{workItem}/move', [GanttController::class, 'move'])->name('projects.gantt.move');
    Route::get('projects/{project}/dependencies', [GanttController::class, 'getDependencies'])->name('projects.gantt.dependencies');
    Route::post('projects/{project}/dependencies', [GanttController::class, 'storeDependency'])->name('projects.gantt.dependencies.store');
    Route::delete('projects/{project}/dependencies/{dependency}', [GanttController::class, 'destroyDependency'])->name('projects.gantt.dependencies.destroy');
    
     // Gantt - Groups
    Route::patch('projects/{project}/groups/{group}/move', [GanttController::class, 'moveGroup'])->name('groups.move');
    Route::patch('projects/{project}/groups/{group}/resize', [GanttController::class, 'resizeGroup'])->name('groups.resize');
    
    // Gantt - Milestones
    Route::patch('projects/{project}/milestones/{milestone}/move', [GanttController::class, 'moveMilestone'])->name('milestones.move');
       

    Route::get('work-items', [WorkItemController::class, 'globalIndex'])->name('work-items.global');
    Route::patch('projects/{project}/work-items/bulk-progress', [WorkItemController::class, 'bulkUpdateProgress'])->name('work-items.bulk-progress');
    Route::patch('work-items/{workItem}/status', [WorkItemController::class, 'updateStatus'])->name('work-items.status.update');

    Route::get('projects/{project}/groups', [ProjectSetupController::class, 'groupsIndex'])->name('projects.groups.index');
    Route::get('projects/{project}/setup', [ProjectSetupController::class, 'show'])->name('projects.setup.show');
    Route::get('projects/{project}/setup-data', [ProjectSetupController::class, 'apiShow'])->name('projects.setup.api');
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