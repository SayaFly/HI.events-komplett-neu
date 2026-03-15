<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PromoCode;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PromoCodeController extends Controller
{
    public function index(Event $event): JsonResponse
    {
        $codes = PromoCode::where('event_id', $event->id)->get();

        return response()->json($codes);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'code'           => ['required', 'string', 'max:100'],
            'discount_type'  => ['required', 'in:percentage,fixed'],
            'discount_value' => ['required', 'numeric', 'min:0'],
            'max_uses'       => ['nullable', 'integer', 'min:1'],
            'valid_from'     => ['nullable', 'date'],
            'valid_until'    => ['nullable', 'date', 'after:valid_from'],
            'is_active'      => ['nullable', 'boolean'],
        ]);

        $data['event_id'] = $event->id;

        abort_if(
            PromoCode::where('event_id', $event->id)->where('code', $data['code'])->exists(),
            422,
            'Promo-Code existiert bereits für dieses Event.'
        );

        $promo = PromoCode::create($data);

        return response()->json($promo, 201);
    }

    public function show(Event $event, PromoCode $promoCode): JsonResponse
    {
        return response()->json($promoCode);
    }

    public function update(Request $request, Event $event, PromoCode $promoCode): JsonResponse
    {
        $data = $request->validate([
            'discount_type'  => ['nullable', 'in:percentage,fixed'],
            'discount_value' => ['nullable', 'numeric', 'min:0'],
            'max_uses'       => ['nullable', 'integer', 'min:1'],
            'valid_from'     => ['nullable', 'date'],
            'valid_until'    => ['nullable', 'date'],
            'is_active'      => ['nullable', 'boolean'],
        ]);

        $promoCode->update($data);

        return response()->json($promoCode->fresh());
    }

    public function destroy(Event $event, PromoCode $promoCode): JsonResponse
    {
        $promoCode->delete();

        return response()->json(null, 204);
    }
}
