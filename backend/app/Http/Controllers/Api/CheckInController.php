<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendee;
use App\Models\CheckInList;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class CheckInController extends Controller
{
    public function index(Event $event): JsonResponse
    {
        $lists = CheckInList::withCount('attendees')
            ->where('event_id', $event->id)
            ->get();

        return response()->json($lists);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'name'            => ['required', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'ticket_type_ids' => ['nullable', 'array'],
            'ticket_type_ids.*' => ['exists:ticket_types,id'],
        ]);

        $list = CheckInList::create([
            'event_id'   => $event->id,
            'name'       => $data['name'],
            'description' => $data['description'] ?? null,
            'short_code' => strtoupper(Str::random(8)),
        ]);

        if (! empty($data['ticket_type_ids'])) {
            $list->ticketTypes()->attach($data['ticket_type_ids']);
        }

        return response()->json($list->load('ticketTypes'), 201);
    }

    public function show(CheckInList $list): JsonResponse
    {
        $list->load(['ticketTypes', 'event:id,title,start_date']);
        $list->loadCount('attendees');

        return response()->json($list);
    }

    public function update(Request $request, CheckInList $list): JsonResponse
    {
        $data = $request->validate([
            'name'            => ['nullable', 'string', 'max:255'],
            'description'     => ['nullable', 'string'],
            'is_active'       => ['nullable', 'boolean'],
            'ticket_type_ids' => ['nullable', 'array'],
            'ticket_type_ids.*' => ['exists:ticket_types,id'],
        ]);

        $list->update($data);

        if (isset($data['ticket_type_ids'])) {
            $list->ticketTypes()->sync($data['ticket_type_ids']);
        }

        return response()->json($list->fresh()->load('ticketTypes'));
    }

    public function destroy(CheckInList $list): JsonResponse
    {
        $list->delete();

        return response()->json(null, 204);
    }

    public function checkIn(Request $request, string $ticketNumber): JsonResponse
    {
        $attendee = Attendee::where('ticket_number', $ticketNumber)
            ->orWhere('public_id', $ticketNumber)
            ->firstOrFail();

        if ($attendee->status === 'cancelled') {
            return response()->json(['message' => 'Ticket wurde storniert.', 'status' => 'cancelled'], 422);
        }

        if ($attendee->status === 'checked_in') {
            return response()->json([
                'message'       => 'Bereits eingecheckt.',
                'status'        => 'already_checked_in',
                'checked_in_at' => $attendee->checked_in_at,
                'attendee'      => $attendee,
            ], 422);
        }

        $attendee->update([
            'status'        => 'checked_in',
            'checked_in_at' => now(),
            'checked_in_by' => $request->user()?->id,
        ]);

        return response()->json([
            'message'  => 'Erfolgreich eingecheckt.',
            'status'   => 'checked_in',
            'attendee' => $attendee->load(['ticketType:id,name', 'event:id,title']),
        ]);
    }

    public function checkOut(string $ticketNumber): JsonResponse
    {
        $attendee = Attendee::where('ticket_number', $ticketNumber)
            ->orWhere('public_id', $ticketNumber)
            ->firstOrFail();

        $attendee->update([
            'status'        => 'active',
            'checked_in_at' => null,
            'checked_in_by' => null,
        ]);

        return response()->json([
            'message'  => 'Checkout erfolgreich.',
            'attendee' => $attendee,
        ]);
    }
}
