<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Google Sheets Auto-Sync Schedule
if (config('services.google_sheets.sync_enabled')) {
    $interval = config('services.google_sheets.sync_interval', 60);
    Schedule::command('sheets:sync')
        ->everyTwoHours($interval)
        ->withoutOverlapping()
        ->onOneServer()
        ->runInBackground();
}
