<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class UploadController extends Controller
{
    private const ALLOWED_MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
    ];

    private const MAX_SIZE_KB = 10240; // 10 MB

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'file'   => ['required', 'file', 'max:' . self::MAX_SIZE_KB, 'mimes:jpg,jpeg,png,gif,webp'],
            'folder' => ['nullable', 'string', 'max:100', 'regex:/^[a-zA-Z0-9_\-\/]+$/'],
        ]);

        $file   = $request->file('file');
        $folder = $request->get('folder', 'uploads');
        $name   = Str::uuid() . '.' . $file->getClientOriginalExtension();
        $path   = $file->storeAs($folder, $name, 'public');

        return response()->json([
            'url'  => Storage::disk('public')->url($path),
            'path' => $path,
            'name' => $name,
        ], 201);
    }
}
