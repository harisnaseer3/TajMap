<?php

namespace App\Policies;

use App\Models\Lead;
use App\Models\User;

class LeadPolicy
{
    /**
     * Determine if the user can view any leads.
     */
    public function viewAny(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can view the lead.
     */
    public function view(User $user, Lead $lead): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if anyone can create leads.
     */
    public function create(?User $user): bool
    {
        return true; // Public can submit leads
    }

    /**
     * Determine if the user can update the lead.
     */
    public function update(User $user, Lead $lead): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can delete the lead.
     */
    public function delete(User $user, Lead $lead): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can assign the lead.
     */
    public function assign(User $user, Lead $lead): bool
    {
        return $user->isAdmin();
    }

    /**
     * Determine if the user can export leads.
     */
    public function export(User $user): bool
    {
        return $user->isAdmin();
    }
}