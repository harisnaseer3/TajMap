<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Plot extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'plot_number',
        'sector',
        'block',
        'coordinates',
        'status',
        'area',
        'price',
        'base_image_id',
        'base_image_transform',
        'description',
        'features',
    ];

    protected function casts(): array
    {
        return [
            'coordinates' => 'array',
            'base_image_transform' => 'array',
            'features' => 'array',
            'area' => 'decimal:2',
            'price' => 'decimal:2',
        ];
    }

    /**
     * Base image relationship
     */
    public function baseImage(): BelongsTo
    {
        return $this->belongsTo(Media::class, 'base_image_id');
    }

    /**
     * Leads for this plot
     */
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class);
    }

    /**
     * Users who saved this plot
     */
    public function savedByUsers(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'saved_plots')
            ->withTimestamps();
    }

    /**
     * Scope for available plots
     */
    public function scopeAvailable($query)
    {
        return $query->where('status', 'available');
    }

    /**
     * Scope for filtering by sector
     */
    public function scopeSector($query, $sector)
    {
        return $query->where('sector', $sector);
    }

    /**
     * Scope for filtering by block
     */
    public function scopeBlock($query, $block)
    {
        return $query->where('block', $block);
    }

    /**
     * Scope for filtering by status
     */
    public function scopeStatus($query, $status)
    {
        return $query->where('status', $status);
    }
}