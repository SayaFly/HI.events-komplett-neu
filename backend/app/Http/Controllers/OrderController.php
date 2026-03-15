<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Ticket;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;

class OrderController extends Controller
{
    public function index(Request $request)
    {
        $query = Order::with(['user', 'event', 'items.ticket'])
            ->when($request->status, fn($q) => $q->where('status', $request->status))
            ->when($request->event_id, fn($q) => $q->where('event_id', $request->event_id))
            ->when($request->search, fn($q) => $q->where(function ($sq) use ($request) {
                $sq->where('order_number', 'like', "%{$request->search}%")
                    ->orWhere('email', 'like', "%{$request->search}%");
            }))
            ->orderBy('created_at', 'desc');

        return response()->json($query->paginate($request->per_page ?? 15));
    }

    public function show($id)
    {
        $order = Order::with(['user', 'event', 'items.ticket'])->findOrFail($id);
        return response()->json($order);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'event_id' => 'required|exists:events,id',
            'first_name' => 'required|string',
            'last_name' => 'required|string',
            'email' => 'required|email',
            'items' => 'required|array|min:1',
            'items.*.ticket_id' => 'required|exists:tickets,id',
            'items.*.quantity' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        return DB::transaction(function () use ($request) {
            $totalAmount = 0;
            $itemsData = [];

            foreach ($request->items as $item) {
                $ticket = Ticket::findOrFail($item['ticket_id']);
                $available = $ticket->quantity - $ticket->quantity_sold;
                if ($available < $item['quantity']) {
                    return response()->json([
                        'message' => "Nicht genügend Tickets verfügbar für: {$ticket->name}"
                    ], 422);
                }
                $subtotal = $ticket->price * $item['quantity'];
                $totalAmount += $subtotal;
                $itemsData[] = [
                    'ticket_id' => $ticket->id,
                    'quantity' => $item['quantity'],
                    'unit_price' => $ticket->price,
                    'subtotal' => $subtotal,
                    'attendee_name' => $item['attendee_name'] ?? null,
                    'attendee_email' => $item['attendee_email'] ?? null,
                ];
            }

            $order = Order::create([
                'user_id' => auth()->id(),
                'event_id' => $request->event_id,
                'order_number' => 'EV-' . strtoupper(Str::random(8)),
                'status' => 'pending',
                'total_amount' => $totalAmount,
                'first_name' => $request->first_name,
                'last_name' => $request->last_name,
                'email' => $request->email,
                'phone' => $request->phone ?? null,
                'notes' => $request->notes ?? null,
                'payment_method' => $request->payment_method ?? 'online',
                'payment_status' => 'pending',
            ]);

            foreach ($itemsData as $itemData) {
                $itemData['order_id'] = $order->id;
                OrderItem::create($itemData);
                Ticket::where('id', $itemData['ticket_id'])->increment('quantity_sold', $itemData['quantity']);
            }

            return response()->json($order->load(['items.ticket', 'event']), 201);
        });
    }

    public function updateStatus(Request $request, $id)
    {
        $order = Order::findOrFail($id);
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:pending,confirmed,cancelled,refunded',
            'payment_status' => 'sometimes|in:pending,paid,failed,refunded',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $data = ['status' => $request->status];
        if ($request->payment_status) {
            $data['payment_status'] = $request->payment_status;
        }
        if ($request->status === 'confirmed' && $request->payment_status === 'paid') {
            $data['paid_at'] = now();
        }

        $order->update($data);
        return response()->json($order->load(['user', 'event', 'items.ticket']));
    }

    public function destroy($id)
    {
        $order = Order::findOrFail($id);
        $order->delete();
        return response()->json(['message' => 'Bestellung gelöscht']);
    }
}
