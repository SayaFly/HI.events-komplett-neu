<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class TicketType extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'event_id', 'name', 'description', 'price', 'quantity',
        'min_per_order', 'max_per_order', 'sale_start_date', 'sale_end_date',
        'status', 'type', 'is_hidden', 'sort_order', 'tax_rate',
    ];

    protected function casts(): array
    {
        return [
            'price'           => 'decimal:2',
            'tax_rate'        => 'decimal:2',
            'is_hidden'       => 'boolean',
            'sale_start_date' => 'datetime',
            'sale_end_date'   => 'datetime',
        ];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class);
    }

    public function getSoldCountAttribute(): int
    {
        return $this->attendees()->whereIn('status', ['active', 'checked_in'])->count();
    }

    public function getAvailableCountAttribute(): ?int
    {
        if ($this->quantity === null) return null;
        return max(0, $this->quantity - $this->sold_count);
    }
}
