<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\BaseController;
use App\Http\Requests\Media\UploadMediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaBaseController extends BaseController
{
    /**
     * Display a listing of media
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Media::query()->with('uploader');

        if ($request->has('type') && $request->type !== '') {
            $query->where('type', $request->type);
        }

        $media = $query->latest()->paginate($request->input('per_page', 20));

        return MediaResource::collection($media);
    }

    /**
     * Upload media file
     */
    public function store(UploadMediaRequest $request): JsonResponse
    {
        $file = $request->file('file');

        // Generate unique filename
        $filename = Str::random(40) . '.' . $file->getClientOriginalExtension();

        // Store file
        $path = $file->storeAs('media', $filename, 'public');

        // Create media record
        $media = Media::create([
            'name' => $file->getClientOriginalName(),
            'file_name' => $filename,
            'mime_type' => $file->getMimeType(),
            'path' => $path,
            'disk' => 'public',
            'size' => $file->getSize(),
            'type' => $request->input('type', 'other'),
            'uploaded_by' => $request->user()->id,
        ]);

        return $this->createdResponse(
            new MediaResource($media),
            'File uploaded successfully'
        );
    }

    /**
     * Display the specified media
     */
    public function show(Media $media): JsonResponse
    {
        $media->load('uploader');

        return $this->successResponse(
            new MediaResource($media),
            'Media retrieved successfully'
        );
    }

    /**
     * Delete the specified media
     */
    public function destroy(Request $request, Media $media): JsonResponse
    {
        // Check if user can delete (owner or admin)
        if ($media->uploaded_by !== $request->user()->id && !$request->user()->isAdmin()) {
            return $this->errorResponse('You do not have permission to delete this media', 403);
        }

        // Delete physical file
        Storage::disk($media->disk)->delete($media->path);

        $media->delete();

        return $this->successResponse(null, 'Media deleted successfully');
    }
}
