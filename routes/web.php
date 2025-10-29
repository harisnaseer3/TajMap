<?php

use Illuminate\Support\Facades\Route;

// Catch-all route for React SPA
// This must be the last route, so it doesn't override API routes
Route::get('/{any}', function () {
    return view('welcome');
})->where('any', '.*');
