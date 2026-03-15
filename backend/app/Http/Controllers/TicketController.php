<?php

namespace App\Http\Controllers;

use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class TicketController extends Controller
{
    public function index(Request $request)
    {
        $query = Ticket::with('event')
            ->when($request->event_id, fn($q) => $q->where('event_id', $request->event_id))
            ->when($request->type, fn($q) => $q->where('type', $request->type));

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function show($id)
    {
        $ticket = Ticket::with('event')->findOrFail($id);
        return response()->json($ticket);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_id' => 'required|exists:events,id',
            'name' => 'required|string|max:255',
            'price' => 'required|numeric|min:0',
            'quantity' => 'required|integer|min:1',
            'type' => 'required|in:standard,vip,free,early_bird',
            'sale_start' => 'nullable|date',
            'sale_end' => 'nullable|date|after:sale_start',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = $request->all();
        $data['is_active'] = $data['is_active'] ?? true;
        $data['quantity_sold'] = 0;

        $ticket = Ticket::create($data);
        return response()->json($ticket->load('event'), 201);
    }

    public function update(Request $request, $id)
    {
        $ticket = Ticket::findOrFail($id);

        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|string|max:255',
            'price' => 'sometimes|numeric|min:0',
            'quantity' => 'sometimes|integer|min:1',
            'type' => 'sometimes|in:standard,vip,free,early_bird',
            'is_active' => 'sometimes|boolean',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $ticket->update($request->all());
        return response()->json($ticket->load('event'));
    }

    public function destroy($id)
    {
        $ticket = Ticket::findOrFail($id);
        $ticket->delete();
        return response()->json(['message' => 'Ticket gelöscht']);
    }
}
