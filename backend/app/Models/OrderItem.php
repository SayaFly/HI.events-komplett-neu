<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class OrderItem extends Model
{
    protected $fillable = [
        'order_id', 'ticket_type_id', 'quantity',
        'unit_price', 'discount', 'tax_rate', 'total',
    ];

    protected function casts(): array
    {
        return [
            'unit_price' => 'decimal:2',
            'discount'   => 'decimal:2',
            'tax_rate'   => 'decimal:2',
            'total'      => 'decimal:2',
        ];
    }

    public function order(): BelongsTo
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'ticket_id',
        'quantity',
        'unit_price',
        'subtotal',
        'attendee_name',
        'attendee_email',
    ];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function ticketType(): BelongsTo
    {
        return $this->belongsTo(TicketType::class);
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class);
    public function ticket()
    {
        return $this->belongsTo(Ticket::class);
    }
}
