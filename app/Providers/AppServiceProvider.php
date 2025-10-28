<?php

namespace App\Providers;

use App\Models\Lead;
use App\Models\Media;
use App\Models\Plot;
use App\Models\Setting;
use App\Policies\LeadPolicy;
use App\Policies\MediaPolicy;
use App\Policies\PlotPolicy;
use App\Policies\SettingPolicy;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * The policy mappings for the application.
     *
     * @var array
     */
    protected $policies = [
        Plot::class => PlotPolicy::class,
        Lead::class => LeadPolicy::class,
        Media::class => MediaPolicy::class,
        Setting::class => SettingPolicy::class,
    ];

    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Register policies
        foreach ($this->policies as $model => $policy) {
            Gate::policy($model, $policy);
        }

        // Define admin gate
        Gate::define('admin', function ($user) {
            return $user->isAdmin();
        });
    }
}
