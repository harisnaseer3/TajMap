<?php

namespace App\Policies;

use App\Models\Media;
use App\Models\User;

class MediaPolicy
{
    /**
     * Determine if the user can view any media.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can view the media.
     */
    public function view(?User $user, Media $media): bool
    {
        return true; // Public access to media
    }

    /**
     * Determine if the user can create media.
     */
    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can update the media.
     */
    public function update(User $user, Media $media): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the media.
     */
    public function delete(User $user, Media $media): bool
    {
        return $user->isAdmin();
    }
}