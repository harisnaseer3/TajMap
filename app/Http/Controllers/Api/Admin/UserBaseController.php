<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rules\Password;

class UserBaseController extends BaseController
{
    /**
     * Display a listing of users
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::query();

        // Filter by role
        if ($request->has('role') && $request->role !== '') {
            $query->where('role', $request->role);
        }

        // Search
        if ($request->has('search') && $request->search !== '') {
            $query->where(function ($q) use ($request) {
                $q->where('name', 'like', '%' . $request->search . '%')
                  ->orWhere('email', 'like', '%' . $request->search . '%')
                  ->orWhere('phone', 'like', '%' . $request->search . '%');
            });
        }

        // Load relationships
        $query->withCount(['assignedLeads', 'savedPlots', 'uploadedMedia']);

        $users = $query->latest()->paginate($request->input('per_page', 20));

        return UserResource::collection($users);
    }

    /**
     * Store a newly created user
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['required', 'in:admin,user'],
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? null,
            'role' => $validated['role'],
        ]);

        return $this->createdResponse(
            new UserResource($user),
            'User created successfully'
        );
    }

    /**
     * Display the specified user
     */
    public function show(User $user): JsonResponse
    {
        $user->loadCount(['assignedLeads', 'savedPlots', 'uploadedMedia']);

        return $this->successResponse(
            new UserResource($user),
            'User retrieved successfully'
        );
    }

    /**
     * Update the specified user
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', 'max:255', 'unique:users,email,' . $user->id],
            'phone' => ['nullable', 'string', 'max:20'],
            'role' => ['sometimes', 'in:admin,user'],
            'password' => ['nullable', 'confirmed', Password::defaults()],
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return $this->successResponse(
            new UserResource($user),
            'User updated successfully'
        );
    }

    /**
     * Remove the specified user
     */
    public function destroy(User $user): JsonResponse
    {
        // Prevent deleting yourself
        if ($user->id === request()->user()->id) {
            return $this->errorResponse('You cannot delete yourself', 400);
        }

        $user->delete();

        return $this->successResponse(null, 'User deleted successfully');
    }

    /**
     * Generate a password reset token for a user
     * Admin can share this token with the user via phone/WhatsApp/in-person
     */
    public function generateResetToken(User $user): JsonResponse
    {
        // Generate a secure random token
        $token = Str::random(64);

        // Save to password_reset_tokens table
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $user->email],
            [
                'email' => $user->email,
                'token' => hash('sha256', $token),
                'created_at' => now()
            ]
        );

        // Generate the reset URL that admin can share
        $resetUrl = config('app.frontend_url', config('app.url'))
            . '/reset-password?token=' . $token
            . '&email=' . urlencode($user->email);

        return $this->successResponse([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'token' => $token,
            'reset_url' => $resetUrl,
            'expires_at' => now()->addHours(24)->format('Y-m-d H:i:s'),
            'note' => 'Share this reset link or token with the user. Valid for 24 hours.',
        ], 'Password reset token generated successfully');
    }

    /**
     * Set a temporary password for a user
     * User will be required to change it on first login
     */
    public function setTemporaryPassword(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'temporary_password' => ['required', 'string', 'min:8'],
        ]);

        // Update user password and set reset required flag
        $user->update([
            'password' => Hash::make($validated['temporary_password']),
            'password_reset_required' => true,
        ]);

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return $this->successResponse([
            'user' => [
                'name' => $user->name,
                'email' => $user->email,
            ],
            'temporary_password' => $validated['temporary_password'],
            'note' => 'Share this temporary password with the user. They must change it on first login.',
        ], 'Temporary password set successfully');
    }

    /**
     * Get users with pending password resets
     */
    public function getPendingResets(): JsonResponse
    {
        // Get users who need to reset their password
        $usersWithResetRequired = User::where('password_reset_required', true)
            ->get(['id', 'name', 'email', 'phone', 'updated_at']);

        // Get users with active reset tokens
        $activeResetTokens = DB::table('password_reset_tokens')
            ->where('created_at', '>', now()->subHours(24))
            ->get();

        $usersWithTokens = [];
        foreach ($activeResetTokens as $resetToken) {
            $user = User::where('email', $resetToken->email)
                ->first(['id', 'name', 'email', 'phone']);

            if ($user) {
                $usersWithTokens[] = [
                    'user' => $user,
                    'token_created_at' => $resetToken->created_at,
                    'expires_at' => now()->parse($resetToken->created_at)->addHours(24)->format('Y-m-d H:i:s'),
                ];
            }
        }

        return $this->successResponse([
            'users_with_temporary_password' => $usersWithResetRequired,
            'users_with_reset_token' => $usersWithTokens,
        ], 'Pending password resets retrieved successfully');
    }

    /**
     * Get all admin users with their permissions
     * Only accessible by super admins
     */
    public function indexWithPermissions(Request $request): JsonResponse
    {
        // Only super admins can view this
        if (!$request->user()->isSuperAdmin()) {
            return $this->errorResponse('Only super administrators can view permissions', 403);
        }

        $admins = User::where('role', 'admin')
            ->orderBy('name')
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'is_super_admin' => $user->isSuperAdmin(),
                    'permissions' => $user->getPermissions(),
                    'created_at' => $user->created_at->format('Y-m-d H:i:s'),
                ];
            });

        return $this->successResponse([
            'admins' => $admins,
            'available_permissions' => User::ALL_PERMISSIONS,
        ], 'Admin users with permissions retrieved successfully');
    }

    /**
     * Get permissions for a specific user
     */
    public function getPermissions(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->successResponse([
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'is_super_admin' => $user->isSuperAdmin(),
            ],
            'permissions' => $user->getPermissions(),
            'available_permissions' => User::ALL_PERMISSIONS,
        ], 'User permissions retrieved successfully');
    }

    /**
     * Update permissions for a user
     * Only super admins can manage permissions
     */
    public function updatePermissions(Request $request, User $user): JsonResponse
    {
        // Only super admins can manage permissions
        if (!$request->user()->isSuperAdmin()) {
            return $this->errorResponse('Only super administrators can manage permissions', 403);
        }

        // Cannot modify super admin permissions
        if ($user->isSuperAdmin()) {
            return $this->errorResponse('Cannot modify super admin permissions', 403);
        }

        // Cannot modify own permissions
        if ($user->id === $request->user()->id) {
            return $this->errorResponse('Cannot modify your own permissions', 403);
        }

        $validated = $request->validate([
            'permissions' => ['required', 'array'],
            'permissions.*' => ['string', 'in:' . implode(',', User::ALL_PERMISSIONS)],
        ]);

        $user->syncPermissions($validated['permissions']);

        return $this->successResponse([
            'user' => new UserResource($user),
            'permissions' => $user->getPermissions(),
        ], 'Permissions updated successfully');
    }
}
