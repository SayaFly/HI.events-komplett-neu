<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TicketType;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TicketTypeController extends Controller
{
    public function index(Event $event): JsonResponse
    {
        $ticketTypes = TicketType::where('event_id', $event->id)
            ->orderBy('sort_order')
            ->get();

        return response()->json($ticketTypes);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['required', 'string', 'max:255'],
            'description'    => ['nullable', 'string'],
            'price'          => ['required', 'numeric', 'min:0'],
            'quantity'       => ['nullable', 'integer', 'min:1'],
            'min_per_order'  => ['nullable', 'integer', 'min:1'],
            'max_per_order'  => ['nullable', 'integer', 'min:1'],
            'sale_start_date' => ['nullable', 'date'],
            'sale_end_date'  => ['nullable', 'date'],
            'status'         => ['nullable', 'in:active,inactive'],
            'type'           => ['nullable', 'in:paid,free,donation'],
            'is_hidden'      => ['nullable', 'boolean'],
            'tax_rate'       => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $data['event_id']   = $event->id;
        $data['sort_order'] = TicketType::where('event_id', $event->id)->max('sort_order') + 1;

        $ticketType = TicketType::create($data);

        return response()->json($ticketType, 201);
    }

    public function show(Event $event, TicketType $ticketType): JsonResponse
    {
        return response()->json($ticketType);
    }

    public function update(Request $request, Event $event, TicketType $ticketType): JsonResponse
    {
        $data = $request->validate([
            'name'           => ['nullable', 'string', 'max:255'],
            'description'    => ['nullable', 'string'],
            'price'          => ['nullable', 'numeric', 'min:0'],
            'quantity'       => ['nullable', 'integer', 'min:1'],
            'min_per_order'  => ['nullable', 'integer', 'min:1'],
            'max_per_order'  => ['nullable', 'integer', 'min:1'],
            'sale_start_date' => ['nullable', 'date'],
            'sale_end_date'  => ['nullable', 'date'],
            'status'         => ['nullable', 'in:active,inactive,sold_out'],
            'type'           => ['nullable', 'in:paid,free,donation'],
            'is_hidden'      => ['nullable', 'boolean'],
            'tax_rate'       => ['nullable', 'numeric', 'min:0', 'max:100'],
        ]);

        $ticketType->update($data);

        return response()->json($ticketType->fresh());
    }

    public function destroy(Event $event, TicketType $ticketType): JsonResponse
    {
        $ticketType->delete();

        return response()->json(null, 204);
    }

    public function sort(Request $request, Event $event): JsonResponse
    {
        $request->validate([
            'ids'   => ['required', 'array'],
            'ids.*' => ['integer', 'exists:ticket_types,id'],
        ]);

        foreach ($request->ids as $index => $id) {
            TicketType::where('id', $id)->where('event_id', $event->id)
                ->update(['sort_order' => $index]);
        }

        return response()->json(['message' => 'Sortierung gespeichert.']);
    }
}
