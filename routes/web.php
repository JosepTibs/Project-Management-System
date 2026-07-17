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

Route::get('dashboard', [DashboardController::class, 'index'])->name('dashboard');

Route::resource('users', UserController::class);
Route::resource('projects', ProjectsController::class);
Route::resource('projects.work-items', WorkItemController::class);
Route::get('projects/{project}/setup', [App\Http\Controllers\ProjectSetupController::class, 'show'])->name('projects.setup.show');
Route::put('projects/{project}/setup', [App\Http\Controllers\ProjectSetupController::class, 'update'])->name('projects.setup.update');

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
