<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendee;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class AttendeeController extends Controller
{
    public function index(Request $request, Event $event): JsonResponse
    {
        $query = Attendee::with(['ticketType:id,name', 'order:id,order_number'])
            ->where('event_id', $event->id);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('first_name', 'like', "%$s%")
                ->orWhere('last_name', 'like', "%$s%")
                ->orWhere('email', 'like', "%$s%")
                ->orWhere('ticket_number', 'like', "%$s%")
            );
        }
        if ($request->filled('ticket_type_id')) {
            $query->where('ticket_type_id', $request->ticket_type_id);
        }

        $attendees = $query->latest()->paginate($request->get('per_page', 50));

        return response()->json($attendees);
    }

    public function show(Attendee $attendee): JsonResponse
    {
        $attendee->load(['ticketType', 'order', 'event:id,title,start_date']);

        return response()->json($attendee);
    }

    public function update(Request $request, Attendee $attendee): JsonResponse
    {
        $data = $request->validate([
            'first_name' => ['nullable', 'string', 'max:255'],
            'last_name'  => ['nullable', 'string', 'max:255'],
            'email'      => ['nullable', 'email'],
            'phone'      => ['nullable', 'string', 'max:50'],
            'notes'      => ['nullable', 'string'],
        ]);

        $attendee->update($data);

        return response()->json($attendee->fresh());
    }

    public function destroy(Attendee $attendee): JsonResponse
    {
        $attendee->update(['status' => 'cancelled']);

        return response()->json(null, 204);
    }

    public function export(Request $request): JsonResponse
    {
        $request->validate(['event_id' => ['required', 'exists:events,id']]);

        $attendees = Attendee::with(['ticketType:id,name', 'order:id,order_number'])
            ->where('event_id', $request->event_id)
            ->get()
            ->map(fn($a) => [
                'ticket_number' => $a->ticket_number,
                'first_name'    => $a->first_name,
                'last_name'     => $a->last_name,
                'email'         => $a->email,
                'phone'         => $a->phone,
                'ticket_type'   => $a->ticketType?->name,
                'order_number'  => $a->order?->order_number,
                'status'        => $a->status,
                'checked_in_at' => $a->checked_in_at,
            ]);

        return response()->json(['data' => $attendees]);
    }
}
