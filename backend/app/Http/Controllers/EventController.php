<?php

namespace App\Http\Controllers;

use App\Models\Event;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(Request $request)
    {
        $query = Event::with(['category', 'organizer'])
            ->when($request->search, fn($q) => $q->where('title', 'like', "%{$request->search}%"))
            ->when($request->category_id, fn($q) => $q->where('category_id', $request->category_id))
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->featured, fn($q) => $q->where('is_featured', true))
            ->orderBy($request->sort_by ?? 'start_date', $request->sort_dir ?? 'asc');

        $perPage = $request->per_page ?? 15;
        return response()->json($query->paginate($perPage));
    }

    public function show($id)
    {
        $event = Event::with(['category', 'organizer', 'tickets'])->findOrFail($id);
        return response()->json($event);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'title' => 'required|string|max:255',
            'description' => 'required|string',
            'category_id' => 'required|exists:categories,id',
            'start_date' => 'required|date',
            'end_date' => 'required|date|after:start_date',
            'location' => 'required|string',
            'city' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['slug'] = $this->generateSlug($request->title);
        $data['organizer_id'] = auth()->id();
        $data['status'] = $data['status'] ?? 'draft';

        $event = Event::create($data);
        return response()->json($event->load(['category', 'organizer']), 201);
    }

    public function update(Request $request, $id)
    {
        $event = Event::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string',
            'category_id' => 'sometimes|exists:categories,id',
            'start_date' => 'sometimes|date',
            'end_date' => 'sometimes|date',
            'location' => 'sometimes|string',
            'city' => 'sometimes|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        if (isset($data['title'])) {
            $data['slug'] = $this->generateSlug($data['title']);
        }

        $event->update($data);
        return response()->json($event->load(['category', 'organizer']));
    }

    public function destroy($id)
    {
        $event = Event::findOrFail($id);
        $event->delete();
        return response()->json(['message' => 'Veranstaltung gelöscht']);
    }

    public function publish($id)
    {
        $event = Event::findOrFail($id);
        $event->update(['status' => 'published']);
        return response()->json($event);
    }

    public function cancel($id)
    {
        $event = Event::findOrFail($id);
        $event->update(['status' => 'cancelled']);
        return response()->json($event);
    }

    private function generateSlug(string $title): string
    {
        return Str::slug($title) . '-' . Str::random(6);
    }
}
