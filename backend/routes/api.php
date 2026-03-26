<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\EventController;
use App\Http\Controllers\Api\TicketTypeController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\AttendeeController;
use App\Http\Controllers\Api\VenueController;
use App\Http\Controllers\Api\OrganizerController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\CheckInController;
use App\Http\Controllers\Api\PromoCodeController;
use App\Http\Controllers\Api\MessageController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\UploadController;

/*
|--------------------------------------------------------------------------
| API Routes – dev.veranstaltungen.de
|--------------------------------------------------------------------------
*/

// Öffentliche Routen
Route::post('/auth/login',          [AuthController::class, 'login']);
Route::post('/auth/register',       [AuthController::class, 'register']);
Route::post('/auth/forgot-password',[AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// Öffentliche Event-Abfragen
Route::get('/events',                [EventController::class, 'index']);
Route::get('/events/{slug}',         [EventController::class, 'showBySlug']);
Route::get('/categories',            [CategoryController::class, 'index']);

// Authentifizierte Routen
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/auth/logout',     [AuthController::class, 'logout']);
    Route::get('/auth/me',          [AuthController::class, 'me']);
    Route::put('/auth/me',          [AuthController::class, 'updateProfile']);
    Route::put('/auth/password',    [AuthController::class, 'changePassword']);

    // Dashboard
    Route::get('/dashboard/stats',  [DashboardController::class, 'stats']);
    Route::get('/dashboard/revenue',[DashboardController::class, 'revenue']);
    Route::get('/dashboard/recent-orders', [DashboardController::class, 'recentOrders']);

    // Upload
    Route::post('/upload',          [UploadController::class, 'store']);

    // Organizers
    Route::apiResource('organizers', OrganizerController::class);
    Route::get('/organizers/{organizer}/stats', [OrganizerController::class, 'stats']);
    Route::post('/organizers/{organizer}/users', [OrganizerController::class, 'addUser']);
    Route::delete('/organizers/{organizer}/users/{user}', [OrganizerController::class, 'removeUser']);

    // Events
    Route::apiResource('organizers.events', EventController::class)->except(['index', 'show']);
    Route::get('/events/{id}',       [EventController::class, 'show']);
    Route::put('/events/{event}/status', [EventController::class, 'updateStatus']);
    Route::get('/events/{event}/stats',  [EventController::class, 'stats']);
    Route::post('/events/{event}/duplicate', [EventController::class, 'duplicate']);

    // Ticket-Typen
    Route::apiResource('events.ticket-types', TicketTypeController::class);
    Route::put('/events/{event}/ticket-types/sort', [TicketTypeController::class, 'sort']);

    // Promo-Codes
    Route::apiResource('events.promo-codes', PromoCodeController::class);

    // Orders
    Route::get('/organizers/{organizer}/orders', [OrderController::class, 'index']);
    Route::get('/events/{event}/orders',         [OrderController::class, 'byEvent']);
    Route::get('/orders/{order}',                [OrderController::class, 'show']);
    Route::put('/orders/{order}/status',         [OrderController::class, 'updateStatus']);
    Route::post('/orders/{order}/refund',        [OrderController::class, 'refund']);

    // Teilnehmer
    Route::get('/events/{event}/attendees',      [AttendeeController::class, 'index']);
    Route::get('/attendees/{attendee}',          [AttendeeController::class, 'show']);
    Route::put('/attendees/{attendee}',          [AttendeeController::class, 'update']);
    Route::delete('/attendees/{attendee}',       [AttendeeController::class, 'destroy']);
    Route::post('/attendees/export',             [AttendeeController::class, 'export']);

    // Check-In
    Route::get('/events/{event}/check-in-lists',        [CheckInController::class, 'index']);
    Route::post('/events/{event}/check-in-lists',       [CheckInController::class, 'store']);
    Route::get('/check-in-lists/{list}',                [CheckInController::class, 'show']);
    Route::put('/check-in-lists/{list}',                [CheckInController::class, 'update']);
    Route::delete('/check-in-lists/{list}',             [CheckInController::class, 'destroy']);
    Route::post('/check-in/{ticketNumber}',             [CheckInController::class, 'checkIn']);
    Route::post('/check-out/{ticketNumber}',            [CheckInController::class, 'checkOut']);

    // Venues
    Route::apiResource('organizers.venues', VenueController::class);

    // Nachrichten
    Route::get('/events/{event}/messages',       [MessageController::class, 'index']);
    Route::post('/events/{event}/messages',      [MessageController::class, 'store']);
    Route::get('/messages/{message}',            [MessageController::class, 'show']);
    Route::delete('/messages/{message}',         [MessageController::class, 'destroy']);
    Route::post('/messages/{message}/send',      [MessageController::class, 'send']);

    // Benutzer (Admin)
    Route::middleware('admin')->group(function () {
        Route::apiResource('users', UserController::class);
        Route::put('/users/{user}/role', [UserController::class, 'updateRole']);

        // Einstellungen
        Route::get('/settings',         [SettingsController::class, 'index']);
        Route::put('/settings',         [SettingsController::class, 'update']);
        Route::get('/settings/{group}', [SettingsController::class, 'byGroup']);

        // Kategorien (Admin)
        Route::apiResource('categories', CategoryController::class)->except(['index']);
    });
});
