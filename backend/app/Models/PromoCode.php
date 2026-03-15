<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PromoCode extends Model
{
    protected $fillable = [
        'event_id', 'code', 'discount_type', 'discount_value',
        'max_uses', 'uses_count', 'valid_from', 'valid_until', 'is_active',
    ];

    protected function casts(): array
    {
        return [
            'discount_value' => 'decimal:2',
            'is_active'      => 'boolean',
            'valid_from'     => 'datetime',
            'valid_until'    => 'datetime',
        ];
    }
}
