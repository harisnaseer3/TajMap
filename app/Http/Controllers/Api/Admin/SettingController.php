<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Setting\StoreSettingRequest;
use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SettingController extends Controller
{
    public function __construct()
    {
        $this->middleware(function ($request, $next) {
            if (!$request->user() || !$request->user()->isAdmin()) {
                abort(403, 'Unauthorized');
            }
            return $next($request);
        });
    }

    /**
     * Display a listing of settings
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Setting::query();

        if ($request->has('group')) {
            $query->where('group', $request->group);
        }

        $settings = $query->latest()->paginate($request->input('per_page', 50));

        return SettingResource::collection($settings);
    }

    /**
     * Store a newly created setting
     */
    public function store(StoreSettingRequest $request): JsonResponse
    {
        $setting = Setting::create($request->validated());

        return response()->json([
            'message' => 'Setting created successfully',
            'setting' => new SettingResource($setting),
        ], 201);
    }

    /**
     * Display the specified setting
     */
    public function show(Setting $setting)
    {
        return new SettingResource($setting);
    }

    /**
     * Update the specified setting
     */
    public function update(UpdateSettingRequest $request, Setting $setting): JsonResponse
    {
        $setting->update($request->validated());

        return response()->json([
            'message' => 'Setting updated successfully',
            'setting' => new SettingResource($setting),
        ]);
    }

    /**
     * Remove the specified setting
     */
    public function destroy(Setting $setting): JsonResponse
    {
        $this->authorize('delete', $setting);

        $setting->delete();

        return response()->json([
            'message' => 'Setting deleted successfully',
        ]);
    }

    /**
     * Get settings by group
     */
    public function byGroup(Request $request, string $group): JsonResponse
    {
        $settings = Setting::getByGroup($group);

        return response()->json(['settings' => $settings]);
    }

    /**
     * Bulk update settings
     */
    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate([
            'settings' => ['required', 'array'],
            'settings.*.key' => ['required', 'string'],
            'settings.*.value' => ['required'],
        ]);

        foreach ($request->settings as $settingData) {
            Setting::set($settingData['key'], $settingData['value']);
        }

        return response()->json([
            'message' => 'Settings updated successfully',
        ]);
    }
}