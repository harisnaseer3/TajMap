<?php

namespace App\Models;

// use Illuminate\Contracts\Auth\MustVerifyEmail;
use App\Notifications\ResetPasswordNotification;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    /** @use HasFactory<\Database\Factories\UserFactory> */
    use HasFactory, Notifiable, HasApiTokens;

    /**
     * Permission constants - Action Level
     */
    // Plot Permissions
    public const PERMISSION_VIEW_PLOTS = 'view_plots';
    public const PERMISSION_CREATE_PLOTS = 'create_plots';
    public const PERMISSION_EDIT_PLOTS = 'edit_plots';
    public const PERMISSION_DELETE_PLOTS = 'delete_plots';
    public const PERMISSION_IMPORT_PLOTS = 'import_plots';
    public const PERMISSION_EXPORT_PLOTS = 'export_plots';

    // Lead Permissions
    public const PERMISSION_VIEW_LEADS = 'view_leads';
    public const PERMISSION_CREATE_LEADS = 'create_leads';
    public const PERMISSION_EDIT_LEADS = 'edit_leads';
    public const PERMISSION_DELETE_LEADS = 'delete_leads';
    public const PERMISSION_ASSIGN_LEADS = 'assign_leads';
    public const PERMISSION_EXPORT_LEADS = 'export_leads';

    // User Permissions
    public const PERMISSION_VIEW_USERS = 'view_users';
    public const PERMISSION_CREATE_USERS = 'create_users';
    public const PERMISSION_EDIT_USERS = 'edit_users';
    public const PERMISSION_DELETE_USERS = 'delete_users';
    public const PERMISSION_MANAGE_USER_PERMISSIONS = 'manage_user_permissions';

    // Settings Permissions
    public const PERMISSION_VIEW_SETTINGS = 'view_settings';
    public const PERMISSION_EDIT_SETTINGS = 'edit_settings';

    public const ALL_PERMISSIONS = [
        // Plots
        self::PERMISSION_VIEW_PLOTS,
        self::PERMISSION_CREATE_PLOTS,
        self::PERMISSION_EDIT_PLOTS,
        self::PERMISSION_DELETE_PLOTS,
        self::PERMISSION_IMPORT_PLOTS,
        self::PERMISSION_EXPORT_PLOTS,
        // Leads
        self::PERMISSION_VIEW_LEADS,
        self::PERMISSION_CREATE_LEADS,
        self::PERMISSION_EDIT_LEADS,
        self::PERMISSION_DELETE_LEADS,
        self::PERMISSION_ASSIGN_LEADS,
        self::PERMISSION_EXPORT_LEADS,
        // Users
        self::PERMISSION_VIEW_USERS,
        self::PERMISSION_CREATE_USERS,
        self::PERMISSION_EDIT_USERS,
        self::PERMISSION_DELETE_USERS,
        self::PERMISSION_MANAGE_USER_PERMISSIONS,
        // Settings
        self::PERMISSION_VIEW_SETTINGS,
        self::PERMISSION_EDIT_SETTINGS,
    ];

    public const PERMISSION_GROUPS = [
        'Plots' => [
            self::PERMISSION_VIEW_PLOTS => 'View Plots',
            self::PERMISSION_CREATE_PLOTS => 'Create Plots',
            self::PERMISSION_EDIT_PLOTS => 'Edit Plots',
            self::PERMISSION_DELETE_PLOTS => 'Delete Plots',
            self::PERMISSION_IMPORT_PLOTS => 'Import Plots',
            self::PERMISSION_EXPORT_PLOTS => 'Export Plots',
        ],
        'Leads' => [
            self::PERMISSION_VIEW_LEADS => 'View Leads',
            self::PERMISSION_CREATE_LEADS => 'Create Leads',
            self::PERMISSION_EDIT_LEADS => 'Edit Leads',
            self::PERMISSION_DELETE_LEADS => 'Delete Leads',
            self::PERMISSION_ASSIGN_LEADS => 'Assign Leads',
            self::PERMISSION_EXPORT_LEADS => 'Export Leads',
        ],
        'Users' => [
            self::PERMISSION_VIEW_USERS => 'View Users',
            self::PERMISSION_CREATE_USERS => 'Create Users',
            self::PERMISSION_EDIT_USERS => 'Edit Users',
            self::PERMISSION_DELETE_USERS => 'Delete Users',
            self::PERMISSION_MANAGE_USER_PERMISSIONS => 'Manage Permissions',
        ],
        'Settings' => [
            self::PERMISSION_VIEW_SETTINGS => 'View Settings',
            self::PERMISSION_EDIT_SETTINGS => 'Edit Settings',
        ],
    ];

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
        'phone',
        'role',
        'is_super_admin',
        'permissions',
        'last_active_at',
        'password_reset_required',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'last_active_at' => 'datetime',
            'password_reset_required' => 'boolean',
            'is_super_admin' => 'boolean',
            'permissions' => 'array',
        ];
    }

    /**
     * Check if user is an admin
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is a super admin
     */
    public function isSuperAdmin(): bool
    {
        return $this->is_super_admin === true;
    }

    /**
     * Check if user has a specific permission
     */
    public function hasPermission(string $permission): bool
    {
        // Super admins have all permissions
        if ($this->isSuperAdmin()) {
            return true;
        }

        // Check if permission exists in user's permissions array
        $permissions = $this->permissions ?? [];
        return in_array($permission, $permissions, true);
    }

    /**
     * Check if user has any of the given permissions
     */
    public function hasAnyPermission(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if ($this->hasPermission($permission)) {
                return true;
            }
        }
        return false;
    }

    /**
     * Check if user has all given permissions
     */
    public function hasAllPermissions(array $permissions): bool
    {
        foreach ($permissions as $permission) {
            if (!$this->hasPermission($permission)) {
                return false;
            }
        }
        return true;
    }

    /**
     * Get all user permissions
     */
    public function getPermissions(): array
    {
        // Super admins have all permissions
        if ($this->isSuperAdmin()) {
            return self::ALL_PERMISSIONS;
        }

        return $this->permissions ?? [];
    }

    /**
     * Grant a permission to the user
     */
    public function grantPermission(string $permission): void
    {
        if (!in_array($permission, self::ALL_PERMISSIONS, true)) {
            throw new \InvalidArgumentException("Invalid permission: {$permission}");
        }

        $permissions = $this->permissions ?? [];
        if (!in_array($permission, $permissions, true)) {
            $permissions[] = $permission;
            $this->permissions = $permissions;
            $this->save();
        }
    }

    /**
     * Revoke a permission from the user
     */
    public function revokePermission(string $permission): void
    {
        $permissions = $this->permissions ?? [];
        $permissions = array_values(array_filter($permissions, function ($p) use ($permission) {
            return $p !== $permission;
        }));
        $this->permissions = $permissions;
        $this->save();
    }

    /**
     * Sync user permissions
     */
    public function syncPermissions(array $permissions): void
    {
        // Validate all permissions
        foreach ($permissions as $permission) {
            if (!in_array($permission, self::ALL_PERMISSIONS, true)) {
                throw new \InvalidArgumentException("Invalid permission: {$permission}");
            }
        }

        $this->permissions = array_values(array_unique($permissions));
        $this->save();
    }

    /**
     * Saved plots relationship
     */
    public function savedPlots(): BelongsToMany
    {
        return $this->belongsToMany(Plot::class, 'saved_plots')
            ->withTimestamps();
    }

    /**
     * Assigned leads
     */
    public function assignedLeads(): HasMany
    {
        return $this->hasMany(Lead::class, 'admin_user_id');
    }

    /**
     * Lead history entries
     */
    public function leadHistories(): HasMany
    {
        return $this->hasMany(LeadHistory::class);
    }

    /**
     * Uploaded media
     */
    public function uploadedMedia(): HasMany
    {
        return $this->hasMany(Media::class, 'uploaded_by');
    }

    /**
     * Send the password reset notification.
     *
     * @param  string  $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }
}
