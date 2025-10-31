<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Setting\StoreSettingRequest;
use App\Http\Requests\Setting\UpdateSettingRequest;
use App\Http\Resources\SettingResource;
use App\Models\Setting;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class SettingBaseController extends BaseController
{
    /**
     * Display a listing of settings
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Setting::query();

        if ($request->has('group') && $request->group !== '') {
            $query->where('group', $request->group);
        }

        $settings = $query->orderBy('group')->orderBy('key')->paginate($request->input('per_page', 50));

        return SettingResource::collection($settings);
    }

    /**
     * Store a newly created setting
     */
    public function store(StoreSettingRequest $request): JsonResponse
    {
        $setting = Setting::create($request->validated());

        return $this->createdResponse(
            new SettingResource($setting),
            'Setting created successfully'
        );
    }

    /**
     * Display the specified setting
     */
    public function show(Setting $setting): JsonResponse
    {
        return $this->successResponse(
            new SettingResource($setting),
            'Setting retrieved successfully'
        );
    }

    /**
     * Update the specified setting
     */
    public function update(UpdateSettingRequest $request, Setting $setting): JsonResponse
    {
        $setting->update($request->validated());

        return $this->successResponse(
            new SettingResource($setting),
            'Setting updated successfully'
        );
    }

    /**
     * Remove the specified setting
     */
    public function destroy(Setting $setting): JsonResponse
    {
        $setting->delete();

        return $this->successResponse(null, 'Setting deleted successfully');
    }

    /**
     * Get settings by group
     */
    public function byGroup(Request $request, string $group): JsonResponse
    {
        $settings = Setting::getByGroup($group);

        return $this->successResponse(
            $settings,
            'Settings retrieved successfully'
        );
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
            'settings.*.type' => ['nullable', 'string', 'in:string,integer,boolean,json'],
            'settings.*.group' => ['nullable', 'string'],
            'settings.*.label' => ['nullable', 'string'],
            'settings.*.description' => ['nullable', 'string'],
        ]);

        foreach ($request->settings as $settingData) {
            $type = $settingData['type'] ?? 'string';
            $value = $settingData['value'];

            Setting::updateOrCreate(
                ['key' => $settingData['key']],
                [
                    'value' => is_array($value) ? json_encode($value) : $value,
                    'type' => $type,
                    'group' => $settingData['group'] ?? 'general',
                    'label' => $settingData['label'] ?? null,
                    'description' => $settingData['description'] ?? null,
                ]
            );
        }

        return $this->successResponse(null, 'Settings updated successfully');
    }
}
