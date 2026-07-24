<?php

use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProjectsController;
use App\Http\Controllers\WorkItemController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');


Route::get('dashboard', [DashboardController::class, 'index'])->middleware(['auth'])->name('dashboard');


Route::resource('users', UserController::class);
Route::get('profile', [App\Http\Controllers\ProfileController::class, 'show'])->middleware(['auth'])->name('profile.show');
Route::resource('projects', ProjectsController::class);
Route::resource('projects.work-items', WorkItemController::class);
Route::get('projects/{project}/kanban', [App\Http\Controllers\ProjectsController::class, 'kanban'])->name('projects.kanban');
Route::get('work-items', [App\Http\Controllers\WorkItemController::class, 'globalIndex'])->name('work-items.global');
Route::patch('projects/{project}/work-items/bulk-progress', [App\Http\Controllers\WorkItemController::class, 'bulkUpdateProgress'])->name('work-items.bulk-progress');
Route::patch('work-items/{workItem}/status', [App\Http\Controllers\WorkItemController::class, 'updateStatus'])->name('work-items.status.update');
Route::get('projects/{project}/groups', [App\Http\Controllers\ProjectSetupController::class, 'groupsIndex'])->name('projects.groups.index');
Route::get('projects/{project}/setup', [App\Http\Controllers\ProjectSetupController::class, 'show'])->name('projects.setup.show');
Route::put('projects/{project}/setup', [App\Http\Controllers\ProjectSetupController::class, 'update'])->name('projects.setup.update');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
