<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Organizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class OrganizerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Organizer::withCount(['events', 'venues']);

        if ($user->role !== 'admin') {
            $query->whereHas('users', fn($q) => $q->where('user_id', $user->id));
        }

        if ($request->filled('search')) {
            $query->where('name', 'like', '%' . $request->search . '%');
        }

        $organizers = $query->paginate($request->get('per_page', 20));

        return response()->json($organizers);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'email'       => ['nullable', 'email'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'website'     => ['nullable', 'url'],
            'address'     => ['nullable', 'string'],
            'city'        => ['nullable', 'string', 'max:255'],
            'state'       => ['nullable', 'string', 'max:255'],
            'zip'         => ['nullable', 'string', 'max:20'],
            'country'     => ['nullable', 'string', 'size:2'],
            'currency'    => ['nullable', 'string', 'size:3'],
            'logo'        => ['nullable', 'url'],
        ]);

        $data['user_id'] = $request->user()->id;
        $data['slug']    = $this->generateSlug($data['name']);

        $organizer = Organizer::create($data);
        $organizer->users()->attach($request->user()->id, ['role' => 'owner']);

        return response()->json($organizer, 201);
    }

    public function show(Organizer $organizer): JsonResponse
    {
        $organizer->loadCount(['events', 'venues']);
        $organizer->load('users:id,name,email,avatar');

        return response()->json($organizer);
    }

    public function update(Request $request, Organizer $organizer): JsonResponse
    {
        $this->authorizeOrganizer($request->user(), $organizer);

        $data = $request->validate([
            'name'        => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'email'       => ['nullable', 'email'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'website'     => ['nullable', 'url'],
            'address'     => ['nullable', 'string'],
            'city'        => ['nullable', 'string', 'max:255'],
            'state'       => ['nullable', 'string', 'max:255'],
            'zip'         => ['nullable', 'string', 'max:20'],
            'country'     => ['nullable', 'string', 'size:2'],
            'currency'    => ['nullable', 'string', 'size:3'],
            'logo'        => ['nullable', 'url'],
            'banner'      => ['nullable', 'url'],
            'is_active'   => ['nullable', 'boolean'],
        ]);

        $organizer->update($data);

        return response()->json($organizer->fresh());
    }

    public function destroy(Request $request, Organizer $organizer): JsonResponse
    {
        if ($request->user()->role !== 'admin') {
            abort(403);
        }

        $organizer->delete();

        return response()->json(null, 204);
    }

    public function stats(Organizer $organizer): JsonResponse
    {
        return response()->json([
            'total_events'    => $organizer->events()->count(),
            'active_events'   => $organizer->events()->where('status', 'published')->count(),
            'total_revenue'   => (float) $organizer->events()
                ->join('orders', 'orders.event_id', '=', 'events.id')
                ->where('orders.status', 'confirmed')
                ->sum('orders.total'),
            'total_attendees' => $organizer->events()
                ->join('attendees', 'attendees.event_id', '=', 'events.id')
                ->whereIn('attendees.status', ['active', 'checked_in'])
                ->count(),
        ]);
    }

    public function addUser(Request $request, Organizer $organizer): JsonResponse
    {
        $this->authorizeOrganizer($request->user(), $organizer, 'admin');

        $request->validate([
            'email' => ['required', 'email', 'exists:users,email'],
            'role'  => ['nullable', 'in:admin,staff'],
        ]);

        $user = \App\Models\User::where('email', $request->email)->first();
        $organizer->users()->syncWithoutDetaching([
            $user->id => ['role' => $request->get('role', 'staff')],
        ]);

        return response()->json(['message' => 'Benutzer hinzugefügt.']);
    }

    public function removeUser(Request $request, Organizer $organizer, \App\Models\User $user): JsonResponse
    {
        $this->authorizeOrganizer($request->user(), $organizer, 'admin');
        $organizer->users()->detach($user->id);

        return response()->json(null, 204);
    }

    private function generateSlug(string $name): string
    {
        $slug     = Str::slug($name, '-', 'de');
        $original = $slug;
        $count    = 1;
        while (Organizer::where('slug', $slug)->exists()) {
            $slug = $original . '-' . $count++;
        }
        return $slug;
    }

    private function authorizeOrganizer($user, Organizer $organizer, string $minRole = 'staff'): void
    {
        if ($user->role === 'admin') return;

        $membership = $organizer->users()->where('user_id', $user->id)->first();
        if (! $membership) abort(403);
    }
}
