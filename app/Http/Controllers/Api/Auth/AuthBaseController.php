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
use Illuminate\Support\Facades\Log;
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
            'password_reset_required' => $user->password_reset_required,
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
     * Forgot password - Returns admin contact instructions
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        // Verify user exists (optional - for better UX, but reduces security)
        $user = User::where('email', $request->email)->first();

        // Always return the same response for security (don't reveal if email exists)
        return response()->json([
            'message' => 'To reset your password, please contact the administrator with your registered email address.',
            'contact_info' => [
                'method' => 'Please contact support for password reset assistance.',
                'note' => 'Have your registered email ready for verification.',
            ],
        ]);
    }

    /**
     * Reset password using token
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            // Attempt to reset the user's password using the 'users' broker
            $status = Password::broker('users')->reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function ($user, $password) {
                    $user->forceFill([
                        'password' => Hash::make($password),
                        'password_reset_required' => false,
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
            $errorMessage = 'Unable to reset password. Please try again or request a new reset link.';
            if ($status === Password::INVALID_TOKEN) {
                $errorMessage = 'This password reset token is invalid or has expired.';
            } elseif ($status === Password::INVALID_USER) {
                $errorMessage = 'We can\'t find a user with that email address.';
            } elseif ($status === Password::RESET_THROTTLED) {
                $errorMessage = 'Please wait before retrying.';
            }

            throw ValidationException::withMessages([
                'email' => [$errorMessage],
            ]);
        } catch (ValidationException $e) {
            throw $e;
        } catch (\Exception $e) {
            // Log the error for debugging
            Log::error('Password reset error: ' . $e->getMessage(), [
                'exception' => $e,
                'email' => $request->email,
                'trace' => $e->getTraceAsString()
            ]);

            throw ValidationException::withMessages([
                'email' => ['An error occurred while resetting your password. Please try again or contact support.'],
            ]);
        }
    }

    /**
     * Change password for authenticated user
     * Used when user has a temporary password or wants to change password
     */
    public function changePassword(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'current_password' => ['required', 'string'],
            'new_password' => ['required', 'string', 'min:8', 'confirmed'],
        ]);

        $user = $request->user();

        // Verify current password
        if (!Hash::check($validated['current_password'], $user->password)) {
            throw ValidationException::withMessages([
                'current_password' => ['The current password is incorrect.'],
            ]);
        }

        // Update password and clear reset required flag
        $user->update([
            'password' => Hash::make($validated['new_password']),
            'password_reset_required' => false,
        ]);

        // Revoke all existing tokens for security
        $user->tokens()->delete();

        return response()->json([
            'message' => 'Password changed successfully. Please login with your new password.',
        ]);
    }
}
