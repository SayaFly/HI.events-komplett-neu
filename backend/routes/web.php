<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json(['message' => 'event-veranstaltungen.de API', 'version' => '1.0']);
});
