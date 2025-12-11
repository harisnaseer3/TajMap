<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Auth\ForgotPasswordRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\ResetPasswordRequest;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthBaseController extends BaseController
{
    /**
     * Register a new user
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'role' => 'user',
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ], 201);
    }

    /**
     * Login user
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'email' => ['The provided credentials are incorrect.'],
            ]);
        }

        // Update last active
        $user->update(['last_active_at' => now()]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'user' => new UserResource($user),
            'token' => $token,
        ]);
    }

    /**
     * Logout user
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => new UserResource($request->user()),
        ]);
    }

    /**
     * Send password reset link via email
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        // Attempt to send the password reset link
        $status = Password::sendResetLink(
            $request->only('email')
        );

        // Always return the same response for security (don't reveal if email exists)
        if ($status === Password::RESET_LINK_SENT) {
            return response()->json([
                'message' => 'If the email exists in our system, you will receive a password reset link shortly.',
            ]);
        }

        // For throttled attempts
        if ($status === Password::RESET_THROTTLED) {
            throw ValidationException::withMessages([
                'email' => ['Please wait before retrying.'],
            ]);
        }

        // For any other status, return the same generic message
        return response()->json([
            'message' => 'If the email exists in our system, you will receive a password reset link shortly.',
        ]);
    }

    /**
     * Reset password using token
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        // Attempt to reset the user's password
        $status = Password::reset(
            $request->only('email', 'password', 'password_confirmation', 'token'),
            function ($user, $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                // Revoke all existing tokens for security
                $user->tokens()->delete();
            }
        );

        // Check the status and return appropriate response
        if ($status === Password::PASSWORD_RESET) {
            return response()->json([
                'message' => 'Your password has been reset successfully. Please login with your new password.',
            ]);
        }

        // Handle invalid or expired token
        throw ValidationException::withMessages([
            'email' => [__($status)],
        ]);
    }
}
