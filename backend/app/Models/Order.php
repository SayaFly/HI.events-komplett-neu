<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Order extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'event_id', 'user_id', 'promo_code_id', 'order_number',
        'status', 'first_name', 'last_name', 'email', 'phone',
        'subtotal', 'discount', 'tax', 'total', 'currency',
        'payment_method', 'payment_id', 'paid_at', 'notes', 'ip_address',
    ];

    protected function casts(): array
    {
        return [
            'paid_at'  => 'datetime',
            'subtotal' => 'decimal:2',
            'discount' => 'decimal:2',
            'tax'      => 'decimal:2',
            'total'    => 'decimal:2',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function promoCode(): BelongsTo
    {
        return $this->belongsTo(PromoCode::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class);
    }
}
