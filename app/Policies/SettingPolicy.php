<?php

namespace App\Policies;

use App\Models\Setting;
use App\Models\User;

class SettingPolicy
{
    /**
     * Determine if the user can view any settings.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can view the setting.
     */
    public function view(User $user, Setting $setting): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can create settings.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the setting.
     */
    public function update(User $user, Setting $setting): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the setting.
     */
    public function delete(User $user, Setting $setting): bool
    {
        return $user->isAdmin();
    }
}