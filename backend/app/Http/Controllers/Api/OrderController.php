<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Order;
use App\Models\Attendee;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OrderController extends Controller
{
    public function index(Request $request, $organizer): JsonResponse
    {
        $query = Order::with(['event:id,title,start_date', 'items.ticketType:id,name'])
            ->whereHas('event', fn($q) => $q->where('organizer_id', $organizer));

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('order_number', 'like', "%$s%")
                ->orWhere('email', 'like', "%$s%")
                ->orWhere('first_name', 'like', "%$s%")
                ->orWhere('last_name', 'like', "%$s%")
            );
        }
        if ($request->filled('date_from')) {
            $query->where('created_at', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('created_at', '<=', $request->date_to);
        }

        $orders = $query->latest()->paginate($request->get('per_page', 25));

        return response()->json($orders);
    }

    public function byEvent(Request $request, Event $event): JsonResponse
    {
        $this->authorize('view', $event);

        $orders = Order::with(['items.ticketType:id,name'])
            ->where('event_id', $event->id)
            ->when($request->filled('status'), fn($q) => $q->where('status', $request->status))
            ->latest()
            ->paginate($request->get('per_page', 25));

        return response()->json($orders);
    }

    public function show(Order $order): JsonResponse
    {
        $order->load([
            'event:id,title,start_date,cover_image',
            'items.ticketType',
            'items.attendees',
            'promoCode:id,code,discount_type,discount_value',
        ]);

        return response()->json($order);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'status' => ['required', 'in:pending,confirmed,cancelled,refunded'],
        ]);

        $order->update(['status' => $request->status]);

        if ($request->status === 'cancelled') {
            $order->attendees()->update(['status' => 'cancelled']);
        }

        return response()->json($order);
    }

    public function refund(Request $request, Order $order): JsonResponse
    {
        $request->validate([
            'amount' => ['required', 'numeric', 'min:0.01', 'max:' . $order->total],
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $isPartial = $request->amount < $order->total;
        $order->update([
            'status' => $isPartial ? 'partially_refunded' : 'refunded',
        ]);

        return response()->json([
            'message' => 'Rückerstattung wurde verarbeitet.',
            'order'   => $order->fresh(),
        ]);
    }
}
