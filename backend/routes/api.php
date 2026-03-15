<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EventController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\TicketController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::prefix('v1')->group(function () {

    // Public auth routes
    Route::post('/auth/login', [AuthController::class, 'login']);
    Route::post('/auth/register', [AuthController::class, 'register']);

    // Public event routes
    Route::get('/events', [EventController::class, 'index']);
    Route::get('/events/{id}', [EventController::class, 'show']);
    Route::get('/categories', [CategoryController::class, 'index']);

    // Protected routes
    Route::middleware('auth.jwt')->group(function () {
        Route::post('/auth/logout', [AuthController::class, 'logout']);
        Route::post('/auth/refresh', [AuthController::class, 'refresh']);
        Route::get('/auth/me', [AuthController::class, 'me']);

        // Dashboard
        Route::get('/dashboard/stats', [DashboardController::class, 'stats']);
        Route::get('/dashboard/revenue', [DashboardController::class, 'revenue']);
        Route::get('/dashboard/recent-orders', [DashboardController::class, 'recentOrders']);

        // Events
        Route::post('/events', [EventController::class, 'store']);
        Route::put('/events/{id}', [EventController::class, 'update']);
        Route::delete('/events/{id}', [EventController::class, 'destroy']);
        Route::patch('/events/{id}/publish', [EventController::class, 'publish']);
        Route::patch('/events/{id}/cancel', [EventController::class, 'cancel']);

        // Categories
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{id}', [CategoryController::class, 'update']);
        Route::delete('/categories/{id}', [CategoryController::class, 'destroy']);

        // Tickets
        Route::get('/tickets', [TicketController::class, 'index']);
        Route::get('/tickets/{id}', [TicketController::class, 'show']);
        Route::post('/tickets', [TicketController::class, 'store']);
        Route::put('/tickets/{id}', [TicketController::class, 'update']);
        Route::delete('/tickets/{id}', [TicketController::class, 'destroy']);

        // Orders
        Route::get('/orders', [OrderController::class, 'index']);
        Route::get('/orders/{id}', [OrderController::class, 'show']);
        Route::post('/orders', [OrderController::class, 'store']);
        Route::patch('/orders/{id}/status', [OrderController::class, 'updateStatus']);
        Route::delete('/orders/{id}', [OrderController::class, 'destroy']);

        // Users
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{id}', [UserController::class, 'show']);
        Route::post('/users', [UserController::class, 'store']);
        Route::put('/users/{id}', [UserController::class, 'update']);
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });
});
