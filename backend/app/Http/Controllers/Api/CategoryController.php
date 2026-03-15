<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\EventCategory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CategoryController extends Controller
{
    public function index(): JsonResponse
    {
        $categories = EventCategory::orderBy('sort_order')->get();

        return response()->json($categories);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'       => ['required', 'string', 'max:255'],
            'icon'       => ['nullable', 'string', 'max:100'],
            'color'      => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $data['slug'] = Str::slug($data['name'], '-', 'de');

        $category = EventCategory::create($data);

        return response()->json($category, 201);
    }

    public function update(Request $request, EventCategory $category): JsonResponse
    {
        $data = $request->validate([
            'name'       => ['nullable', 'string', 'max:255'],
            'icon'       => ['nullable', 'string', 'max:100'],
            'color'      => ['nullable', 'string', 'max:20'],
            'sort_order' => ['nullable', 'integer'],
        ]);

        $category->update($data);

        return response()->json($category->fresh());
    }

    public function destroy(EventCategory $category): JsonResponse
    {
        $category->delete();

        return response()->json(null, 204);
    }
}
