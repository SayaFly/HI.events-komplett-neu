<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Organizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class EventController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Event::with(['organizer:id,name,slug', 'venue:id,name,city', 'category:id,name,slug,icon,color'])
            ->where('status', 'published')
            ->where('visibility', 'public');

        if ($request->filled('category')) {
            $query->whereHas('category', fn($q) => $q->where('slug', $request->category));
        }
        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }
        if ($request->filled('city')) {
            $query->whereHas('venue', fn($q) => $q->where('city', 'like', '%' . $request->city . '%'));
        }
        if ($request->filled('date_from')) {
            $query->where('start_date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('start_date', '<=', $request->date_to);
        }
        if ($request->boolean('featured')) {
            $query->where('is_featured', true);
        }

        $events = $query->orderBy('start_date')->paginate($request->get('per_page', 20));

        return response()->json($events);
    }

    public function store(Request $request, Organizer $organizer): JsonResponse
    {
        $this->authorizeOrganizer($request->user(), $organizer);

        $data = $request->validate([
            'title'             => ['required', 'string', 'max:500'],
            'description'       => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'start_date'        => ['required', 'date'],
            'end_date'          => ['nullable', 'date', 'after:start_date'],
            'timezone'          => ['nullable', 'string', 'max:50'],
            'status'            => ['nullable', 'in:draft,published,cancelled'],
            'visibility'        => ['nullable', 'in:public,private,unlisted'],
            'venue_id'          => ['nullable', 'exists:venues,id'],
            'category_id'       => ['nullable', 'exists:event_categories,id'],
            'cover_image'       => ['nullable', 'url'],
            'banner_image'      => ['nullable', 'url'],
            'max_attendees'     => ['nullable', 'integer', 'min:1'],
            'is_online'         => ['nullable', 'boolean'],
            'online_url'        => ['nullable', 'url'],
            'website'           => ['nullable', 'url'],
            'tags'              => ['nullable', 'array'],
            'currency'          => ['nullable', 'string', 'size:3'],
            'is_featured'       => ['nullable', 'boolean'],
        ]);

        $data['organizer_id'] = $organizer->id;
        $data['slug']         = $this->generateSlug($data['title']);

        $event = Event::create($data);
        $event->load(['organizer:id,name', 'venue:id,name,city', 'category:id,name,slug']);

        return response()->json($event, 201);
    }

    public function show(Request $request, int $id): JsonResponse
    {
        $event = Event::with([
            'organizer:id,name,slug,logo',
            'venue',
            'category',
            'ticketTypes' => fn($q) => $q->where('status', 'active')->orderBy('sort_order'),
        ])->findOrFail($id);

        if (in_array($event->status, ['draft', 'archived']) && $request->user()?->role !== 'admin') {
            abort(403);
        }

        $event->increment('views_count');

        return response()->json($event);
    }

    public function showBySlug(string $slug): JsonResponse
    {
        $event = Event::with([
            'organizer:id,name,slug,logo',
            'venue',
            'category',
            'ticketTypes' => fn($q) => $q->where('status', 'active')->orderBy('sort_order'),
        ])->where('slug', $slug)->where('status', 'published')->firstOrFail();

        $event->increment('views_count');

        return response()->json($event);
    }

    public function update(Request $request, Organizer $organizer, Event $event): JsonResponse
    {
        $this->authorizeOrganizer($request->user(), $organizer);

        $data = $request->validate([
            'title'             => ['sometimes', 'string', 'max:500'],
            'description'       => ['nullable', 'string'],
            'short_description' => ['nullable', 'string', 'max:1000'],
            'start_date'        => ['sometimes', 'date'],
            'end_date'          => ['nullable', 'date'],
            'timezone'          => ['nullable', 'string', 'max:50'],
            'status'            => ['nullable', 'in:draft,published,cancelled,completed,archived'],
            'visibility'        => ['nullable', 'in:public,private,unlisted'],
            'venue_id'          => ['nullable', 'exists:venues,id'],
            'category_id'       => ['nullable', 'exists:event_categories,id'],
            'cover_image'       => ['nullable', 'url'],
            'banner_image'      => ['nullable', 'url'],
            'max_attendees'     => ['nullable', 'integer', 'min:1'],
            'is_online'         => ['nullable', 'boolean'],
            'online_url'        => ['nullable', 'url'],
            'website'           => ['nullable', 'url'],
            'tags'              => ['nullable', 'array'],
            'currency'          => ['nullable', 'string', 'size:3'],
            'is_featured'       => ['nullable', 'boolean'],
        ]);

        $event->update($data);
        $event->load(['organizer:id,name', 'venue:id,name,city', 'category:id,name,slug']);

        return response()->json($event);
    }

    public function destroy(Request $request, Organizer $organizer, Event $event): JsonResponse
    {
        $this->authorizeOrganizer($request->user(), $organizer);
        $event->delete();

        return response()->json(null, 204);
    }

    public function updateStatus(Request $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $request->validate(['status' => ['required', 'in:draft,published,cancelled,completed,archived']]);
        $event->update(['status' => $request->status]);

        return response()->json($event);
    }

    public function stats(Request $request, Event $event): JsonResponse
    {
        $totalTickets  = $event->ticketTypes()->sum('quantity');
        $soldTickets   = $event->attendees()->whereIn('status', ['active', 'checked_in'])->count();
        $totalRevenue  = $event->orders()->where('status', 'confirmed')->sum('total');
        $checkedIn     = $event->attendees()->where('status', 'checked_in')->count();
        $totalOrders   = $event->orders()->count();

        return response()->json([
            'total_tickets'  => $totalTickets,
            'sold_tickets'   => $soldTickets,
            'available'      => $totalTickets ? $totalTickets - $soldTickets : null,
            'total_revenue'  => (float) $totalRevenue,
            'total_orders'   => $totalOrders,
            'checked_in'     => $checkedIn,
            'check_in_rate'  => $soldTickets > 0 ? round($checkedIn / $soldTickets * 100, 1) : 0,
        ]);
    }

    public function duplicate(Request $request, Event $event): JsonResponse
    {
        $this->authorize('update', $event);

        $newEvent = $event->replicate();
        $newEvent->title  = $event->title . ' (Kopie)';
        $newEvent->slug   = $this->generateSlug($newEvent->title);
        $newEvent->status = 'draft';
        $newEvent->views_count = 0;
        $newEvent->save();

        foreach ($event->ticketTypes as $tt) {
            $newTt = $tt->replicate();
            $newTt->event_id = $newEvent->id;
            $newTt->save();
        }

        return response()->json($newEvent, 201);
    }

    private function generateSlug(string $title): string
    {
        $slug = Str::slug($title, '-', 'de');
        $original = $slug;
        $count = 1;
        while (Event::where('slug', $slug)->exists()) {
            $slug = $original . '-' . $count++;
        }
        return $slug;
    }

    private function authorizeOrganizer($user, Organizer $organizer): void
    {
        if ($user->role === 'admin') {
            return;
        }
        if (! $organizer->users()->where('user_id', $user->id)->exists()) {
            abort(403, 'Kein Zugriff auf diesen Veranstalter.');
        }
    }
}
