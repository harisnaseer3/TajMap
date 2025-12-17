<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserHasPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        // Check if user is authenticated
        if (!$request->user()) {
            return response()->json([
                'message' => 'Unauthenticated',
            ], 401);
        }

        // Check if user is admin
        if (!$request->user()->isAdmin()) {
            return response()->json([
                'message' => 'Admin access required',
            ], 403);
        }

        // Super admins bypass all permission checks
        if ($request->user()->isSuperAdmin()) {
            return $next($request);
        }

        // Check if user has the required permission
        if (!$request->user()->hasPermission($permission)) {
            return response()->json([
                'message' => 'Insufficient permissions',
                'required_permission' => $permission,
            ], 403);
        }

        return $next($request);
    }
}
