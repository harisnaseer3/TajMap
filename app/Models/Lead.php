<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Lead extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'plot_id',
        'admin_user_id',
        'name',
        'phone',
        'email',
        'message',
        'status',
        'score',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
            'score' => 'integer',
        ];
    }

    /**
     * Boot method to add observers
     */
    protected static function boot()
    {
        parent::boot();

        // Auto-calculate lead score when created or updated
        static::saving(function ($lead) {
            $lead->score = $lead->calculateScore();
        });

        // Log status changes to history
        static::updating(function ($lead) {
            if ($lead->isDirty('status')) {
                $lead->logHistory('status_changed', "Status changed from {$lead->getOriginal('status')} to {$lead->status}", [
                    'old_status' => $lead->getOriginal('status'),
                    'new_status' => $lead->status,
                ]);
            }

            if ($lead->isDirty('admin_user_id')) {
                $lead->logHistory('assigned', "Lead assigned to admin", [
                    'old_admin_id' => $lead->getOriginal('admin_user_id'),
                    'new_admin_id' => $lead->admin_user_id,
                ]);
            }
        });
    }

    /**
     * Plot relationship
     */
    public function plot(): BelongsTo
    {
        return $this->belongsTo(Plot::class);
    }

    /**
     * Assigned admin user
     */
    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    /**
     * Lead history entries
     */
    public function histories(): HasMany
    {
        return $this->hasMany(LeadHistory::class)->latest();
    }

    /**
     * Calculate lead score (0-100)
     */
    public function calculateScore(): int
    {
        $score = 0;

        // Email provided: +20 points
        if ($this->email) {
            $score += 20;
        }

        // Message provided: +15 points
        if ($this->message) {
            $score += 15;
        }

        // Plot selected: +25 points
        if ($this->plot_id) {
            $score += 25;
        }

        // Status-based scoring
        switch ($this->status) {
            case 'new':
                $score += 10;
                break;
            case 'contacted':
                $score += 20;
                break;
            case 'interested':
                $score += 30;
                break;
            case 'closed':
                $score += 40;
                break;
        }

        return min(100, $score);
    }

    /**
     * Log history entry
     */
    public function logHistory(string $action, ?string $details = null, ?array $metadata = null): void
    {
        $this->histories()->create([
            'user_id' => auth()->id(),
            'action' => $action,
            'details' => $details,
            'metadata' => $metadata,
        ]);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }

    /**
     * Scope for assigned to specific admin
     */
    public function scopeAssignedTo($query, $adminId)
    {
        return $query->where('admin_user_id', $adminId);
    }
}