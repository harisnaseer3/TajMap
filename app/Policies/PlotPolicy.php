<?php

namespace App\Policies;

use App\Models\Plot;
use App\Models\User;

class PlotPolicy
{
    /**
     * Determine if the user can view any plots.
     */
    public function viewAny(?User $user): bool
    {
        return true; // Public access
    }

    /**
     * Determine if the user can view the plot.
     */
    public function view(?User $user, Plot $plot): bool
    {
        return true; // Public access
    }

    /**
     * Determine if the user can create plots.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin() &&
               ($user->isSuperAdmin() || $user->hasPermission(User::PERMISSION_CREATE_PLOTS));
    }

    /**
     * Determine if the user can update the plot.
     */
    public function update(User $user, Plot $plot): bool
    {
        return $user->isAdmin() &&
               ($user->isSuperAdmin() || $user->hasPermission(User::PERMISSION_EDIT_PLOTS));
    }

    /**
     * Determine if the user can delete the plot.
     */
    public function delete(User $user, Plot $plot): bool
    {
        return $user->isAdmin() &&
               ($user->isSuperAdmin() || $user->hasPermission(User::PERMISSION_DELETE_PLOTS));
    }

    /**
     * Determine if the user can restore the plot.
     */
    public function restore(User $user, Plot $plot): bool
    {
        return $user->isAdmin() &&
               ($user->isSuperAdmin() || $user->hasPermission(User::PERMISSION_EDIT_PLOTS));
    }

    /**
     * Determine if the user can permanently delete the plot.
     */
    public function forceDelete(User $user, Plot $plot): bool
    {
        return $user->isAdmin() &&
               ($user->isSuperAdmin() || $user->hasPermission(User::PERMISSION_DELETE_PLOTS));
    }
}