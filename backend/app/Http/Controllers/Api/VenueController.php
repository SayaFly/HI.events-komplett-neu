<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Venue;
use App\Models\Organizer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VenueController extends Controller
{
    public function index(Organizer $organizer): JsonResponse
    {
        $venues = Venue::where('organizer_id', $organizer->id)->get();

        return response()->json($venues);
    }

    public function store(Request $request, Organizer $organizer): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address'     => ['required', 'string'],
            'city'        => ['required', 'string', 'max:255'],
            'state'       => ['nullable', 'string', 'max:255'],
            'zip'         => ['nullable', 'string', 'max:20'],
            'country'     => ['nullable', 'string', 'size:2'],
            'latitude'    => ['nullable', 'numeric'],
            'longitude'   => ['nullable', 'numeric'],
            'capacity'    => ['nullable', 'integer', 'min:1'],
            'website'     => ['nullable', 'url'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'email'       => ['nullable', 'email'],
            'image'       => ['nullable', 'url'],
            'is_online'   => ['nullable', 'boolean'],
        ]);

        $data['organizer_id'] = $organizer->id;
        $venue = Venue::create($data);

        return response()->json($venue, 201);
    }

    public function show(Organizer $organizer, Venue $venue): JsonResponse
    {
        return response()->json($venue);
    }

    public function update(Request $request, Organizer $organizer, Venue $venue): JsonResponse
    {
        $data = $request->validate([
            'name'        => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'address'     => ['nullable', 'string'],
            'city'        => ['nullable', 'string', 'max:255'],
            'state'       => ['nullable', 'string', 'max:255'],
            'zip'         => ['nullable', 'string', 'max:20'],
            'country'     => ['nullable', 'string', 'size:2'],
            'latitude'    => ['nullable', 'numeric'],
            'longitude'   => ['nullable', 'numeric'],
            'capacity'    => ['nullable', 'integer', 'min:1'],
            'website'     => ['nullable', 'url'],
            'phone'       => ['nullable', 'string', 'max:50'],
            'email'       => ['nullable', 'email'],
            'image'       => ['nullable', 'url'],
            'is_online'   => ['nullable', 'boolean'],
        ]);

        $venue->update($data);

        return response()->json($venue->fresh());
    }

    public function destroy(Organizer $organizer, Venue $venue): JsonResponse
    {
        $venue->delete();

        return response()->json(null, 204);
    }
}
