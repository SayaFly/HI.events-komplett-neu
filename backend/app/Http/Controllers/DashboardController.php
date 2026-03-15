<?php

namespace App\Http\Controllers;

use App\Models\Event;
use App\Models\Order;
use App\Models\Ticket;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats()
    {
        $totalEvents = Event::count();
        $publishedEvents = Event::where('status', 'published')->count();
        $totalOrders = Order::count();
        $confirmedOrders = Order::where('status', 'confirmed')->count();
        $totalRevenue = Order::where('payment_status', 'paid')->sum('total_amount');
        $totalUsers = User::count();
        $ticketsSold = Ticket::sum('quantity_sold');

        $thisMonth = now()->startOfMonth();
        $lastMonth = now()->subMonth()->startOfMonth();
        $lastMonthEnd = now()->subMonth()->endOfMonth();

        $revenueThisMonth = Order::where('payment_status', 'paid')
            ->where('created_at', '>=', $thisMonth)
            ->sum('total_amount');

        $revenueLastMonth = Order::where('payment_status', 'paid')
            ->whereBetween('created_at', [$lastMonth, $lastMonthEnd])
            ->sum('total_amount');

        $ordersThisMonth = Order::where('created_at', '>=', $thisMonth)->count();
        $newUsersThisMonth = User::where('created_at', '>=', $thisMonth)->count();

        return response()->json([
            'total_events' => $totalEvents,
            'published_events' => $publishedEvents,
            'total_orders' => $totalOrders,
            'confirmed_orders' => $confirmedOrders,
            'total_revenue' => $totalRevenue,
            'total_users' => $totalUsers,
            'tickets_sold' => $ticketsSold,
            'revenue_this_month' => $revenueThisMonth,
            'revenue_last_month' => $revenueLastMonth,
            'orders_this_month' => $ordersThisMonth,
            'new_users_this_month' => $newUsersThisMonth,
        ]);
    }

    public function revenue(Request $request)
    {
        $months = $request->months ?? 6;

        $data = [];
        for ($i = $months - 1; $i >= 0; $i--) {
            $month = now()->subMonths($i);
            $revenue = Order::where('payment_status', 'paid')
                ->whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->sum('total_amount');
            $orders = Order::whereYear('created_at', $month->year)
                ->whereMonth('created_at', $month->month)
                ->count();
            $data[] = [
                'month' => $month->format('Y-m'),
                'label' => $month->locale('de')->isoFormat('MMM YYYY'),
                'revenue' => (float) $revenue,
                'orders' => $orders,
            ];
        }

        return response()->json($data);
    }

    public function recentOrders(Request $request)
    {
        $limit = $request->limit ?? 10;
        $orders = Order::with(['user', 'event'])
            ->orderBy('created_at', 'desc')
            ->limit($limit)
            ->get();

        return response()->json($orders);
    }
}
