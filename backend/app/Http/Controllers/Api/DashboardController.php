<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Event;
use App\Models\Order;
use App\Models\Attendee;
use App\Models\Organizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user        = $request->user();
        $organizerIds = $this->getOrganizerIds($user);

        $totalEvents     = Event::whereIn('organizer_id', $organizerIds)->count();
        $publishedEvents = Event::whereIn('organizer_id', $organizerIds)->where('status', 'published')->count();
        $totalOrders     = Order::whereHas('event', fn($q) => $q->whereIn('organizer_id', $organizerIds))->count();
        $totalRevenue    = Order::whereHas('event', fn($q) => $q->whereIn('organizer_id', $organizerIds))
            ->where('status', 'confirmed')
            ->sum('total');
        $totalAttendees  = Attendee::whereHas('event', fn($q) => $q->whereIn('organizer_id', $organizerIds))->count();
        $checkedIn       = Attendee::whereHas('event', fn($q) => $q->whereIn('organizer_id', $organizerIds))
            ->where('status', 'checked_in')
            ->count();

        return response()->json([
            'total_events'     => $totalEvents,
            'published_events' => $publishedEvents,
            'total_orders'     => $totalOrders,
            'total_revenue'    => (float) $totalRevenue,
            'total_attendees'  => $totalAttendees,
            'checked_in'       => $checkedIn,
        ]);
    }

    public function revenue(Request $request): JsonResponse
    {
        $user         = $request->user();
        $organizerIds = $this->getOrganizerIds($user);
        $period       = $request->get('period', '30'); // Tage

        $revenue = Order::whereHas('event', fn($q) => $q->whereIn('organizer_id', $organizerIds))
            ->where('status', 'confirmed')
            ->where('created_at', '>=', now()->subDays((int) $period))
            ->selectRaw('DATE(created_at) as date, SUM(total) as total, COUNT(*) as orders')
            ->groupBy('date')
            ->orderBy('date')
            ->get();

        return response()->json(['data' => $revenue]);
    }

    public function recentOrders(Request $request): JsonResponse
    {
        $user         = $request->user();
        $organizerIds = $this->getOrganizerIds($user);

        $orders = Order::with(['event:id,title', 'items.ticketType:id,name'])
            ->whereHas('event', fn($q) => $q->whereIn('organizer_id', $organizerIds))
            ->latest()
            ->limit(10)
            ->get();

        return response()->json(['data' => $orders]);
    }

    private function getOrganizerIds($user): array
    {
        if ($user->role === 'admin') {
            return Organizer::pluck('id')->toArray();
        }
        return $user->organizers()->pluck('organizers.id')->toArray();
    }
}
