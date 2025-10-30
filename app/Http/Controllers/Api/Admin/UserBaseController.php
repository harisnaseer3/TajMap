<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Hash;
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
}
