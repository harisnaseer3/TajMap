<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Plot;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class AnalyticsController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$request->user() || !$request->user()->isAdmin()) {
                abort(403, 'Unauthorized');
            }
            return $next($request);
        });
    }

    /**
     * Get dashboard analytics
     */
    public function dashboard(): JsonResponse
    {
        // Plot statistics
        $totalPlots = Plot::count();
        $availablePlots = Plot::where('status', 'available')->count();
        $reservedPlots = Plot::where('status', 'reserved')->count();
        $soldPlots = Plot::where('status', 'sold')->count();

        $plotsByStatus = [
            ['status' => 'Available', 'count' => $availablePlots],
            ['status' => 'Reserved', 'count' => $reservedPlots],
            ['status' => 'Sold', 'count' => $soldPlots],
        ];

        // Lead statistics
        $totalLeads = Lead::count();
        $newLeads = Lead::where('status', 'new')->count();
        $contactedLeads = Lead::where('status', 'contacted')->count();
        $interestedLeads = Lead::where('status', 'interested')->count();
        $closedLeads = Lead::where('status', 'closed')->count();

        $leadsByStatus = [
            ['status' => 'New', 'count' => $newLeads],
            ['status' => 'Contacted', 'count' => $contactedLeads],
            ['status' => 'Interested', 'count' => $interestedLeads],
            ['status' => 'Closed', 'count' => $closedLeads],
        ];

        // Recent leads
        $recentLeads = Lead::with(['plot', 'adminUser'])
            ->latest()
            ->limit(5)
            ->get();

        return response()->json([
            'plots' => [
                'total' => $totalPlots,
                'available' => $availablePlots,
                'reserved' => $reservedPlots,
                'sold' => $soldPlots,
                'by_status' => $plotsByStatus,
            ],
            'leads' => [
                'total' => $totalLeads,
                'new' => $newLeads,
                'contacted' => $contactedLeads,
                'interested' => $interestedLeads,
                'closed' => $closedLeads,
                'by_status' => $leadsByStatus,
                'recent' => $recentLeads,
            ],
        ]);
    }

    /**
     * Get monthly trends
     */
    public function monthlyTrends(Request $request): JsonResponse
    {
        $months = $request->input('months', 12);

        // Plot trends
        $plotTrends = Plot::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('count(*) as count'),
            'status'
        )
            ->where('created_at', '>=', now()->subMonths($months))
            ->groupBy('month', 'status')
            ->orderBy('month')
            ->get()
            ->groupBy('month')
            ->map(function ($items, $month) {
                return [
                    'month' => $month,
                    'available' => $items->where('status', 'available')->sum('count'),
                    'reserved' => $items->where('status', 'reserved')->sum('count'),
                    'sold' => $items->where('status', 'sold')->sum('count'),
                ];
            })
            ->values();

        // Lead trends
        $leadTrends = Lead::select(
            DB::raw('DATE_FORMAT(created_at, "%Y-%m") as month'),
            DB::raw('count(*) as count')
        )
            ->where('created_at', '>=', now()->subMonths($months))
            ->groupBy('month')
            ->orderBy('month')
            ->get();

        return response()->json([
            'plot_trends' => $plotTrends,
            'lead_trends' => $leadTrends,
        ]);
    }

    /**
     * Get admin performance statistics
     */
    public function adminPerformance(): JsonResponse
    {
        $admins = User::where('role', 'admin')
            ->withCount([
                'assignedLeads',
                'assignedLeads as new_leads_count' => function ($query) {
                    $query->where('status', 'new');
                },
                'assignedLeads as contacted_leads_count' => function ($query) {
                    $query->where('status', 'contacted');
                },
                'assignedLeads as interested_leads_count' => function ($query) {
                    $query->where('status', 'interested');
                },
                'assignedLeads as closed_leads_count' => function ($query) {
                    $query->where('status', 'closed');
                },
            ])
            ->get()
            ->map(function ($admin) {
                return [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                    'total_leads' => $admin->assigned_leads_count,
                    'new_leads' => $admin->new_leads_count,
                    'contacted_leads' => $admin->contacted_leads_count,
                    'interested_leads' => $admin->interested_leads_count,
                    'closed_leads' => $admin->closed_leads_count,
                    'conversion_rate' => $admin->assigned_leads_count > 0
                        ? round(($admin->closed_leads_count / $admin->assigned_leads_count) * 100, 2)
                        : 0,
                ];
            });

        return response()->json(['admins' => $admins]);
    }

    /**
     * Get plot distribution by sector
     */
    public function plotDistribution(): JsonResponse
    {
        $bySector = Plot::select('sector', DB::raw('count(*) as count'))
            ->whereNotNull('sector')
            ->groupBy('sector')
            ->get();

        $byBlock = Plot::select('block', DB::raw('count(*) as count'))
            ->whereNotNull('block')
            ->groupBy('block')
            ->limit(10)
            ->get();

        return response()->json([
            'by_sector' => $bySector,
            'by_block' => $byBlock,
        ]);
    }
}