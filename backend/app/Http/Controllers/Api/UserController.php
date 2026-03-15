<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;

class UserController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = User::query();

        if ($request->filled('search')) {
            $s = $request->search;
            $query->where(fn($q) => $q
                ->where('name', 'like', "%$s%")
                ->orWhere('email', 'like', "%$s%")
            );
        }
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        $users = $query->orderBy('name')->paginate($request->get('per_page', 25));

        return response()->json($users);
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users'],
            'password' => ['required', Rules\Password::defaults()],
            'role'     => ['nullable', 'in:admin,organizer,staff,attendee'],
        ]);

        $data['password'] = Hash::make($data['password']);
        $user = User::create($data);

        return response()->json($user, 201);
    }

    public function show(User $user): JsonResponse
    {
        return response()->json($user);
    }

    public function update(Request $request, User $user): JsonResponse
    {
        $data = $request->validate([
            'name'     => ['nullable', 'string', 'max:255'],
            'email'    => ['nullable', 'email', 'unique:users,email,' . $user->id],
            'role'     => ['nullable', 'in:admin,organizer,staff,attendee'],
            'phone'    => ['nullable', 'string', 'max:50'],
            'is_active'=> ['nullable', 'boolean'],
        ]);

        $user->update($data);

        return response()->json($user->fresh());
    }

    public function destroy(User $user): JsonResponse
    {
        $user->delete();

        return response()->json(null, 204);
    }

    public function updateRole(Request $request, User $user): JsonResponse
    {
        $request->validate(['role' => ['required', 'in:admin,organizer,staff,attendee']]);
        $user->update(['role' => $request->role]);

        return response()->json($user->fresh());
    }
}
