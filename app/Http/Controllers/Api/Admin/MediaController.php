<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Media\UploadMediaRequest;
use App\Http\Resources\MediaResource;
use App\Models\Media;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MediaController extends Controller
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
     * Display a listing of media
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Media::query()->with('uploader');

        if ($request->has('type')) {
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

        return response()->json([
            'message' => 'File uploaded successfully',
            'media' => new MediaResource($media),
        ], 201);
    }

    /**
     * Display the specified media
     */
    public function show(Media $media)
    {
        $media->load('uploader');

        return new MediaResource($media);
    }

    /**
     * Delete the specified media
     */
    public function destroy(Media $media): JsonResponse
    {
        $this->authorize('delete', $media);

        $media->delete();

        return response()->json([
            'message' => 'Media deleted successfully',
        ]);
    }
}