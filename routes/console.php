<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule due date reminder notifications to run daily at 8:00 AM
Schedule::command('notifications:due-date-reminders')
    ->dailyAt('09:00')
    ->timezone('Asia/Manila');
