<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index(): JsonResponse
    {
        $settings = Setting::all()->groupBy('group')->map(fn($group) =>
            $group->pluck('value', 'key')
        );

        return response()->json($settings);
    }

    public function byGroup(string $group): JsonResponse
    {
        $settings = Setting::where('group', $group)->get()->pluck('value', 'key');

        return response()->json($settings);
    }

    public function update(Request $request): JsonResponse
    {
        $request->validate([
            'settings'   => ['required', 'array'],
            'settings.*' => ['nullable', 'string'],
        ]);

        foreach ($request->settings as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key],
                ['value' => $value]
            );
        }

        return response()->json(['message' => 'Einstellungen gespeichert.']);
    }
}
