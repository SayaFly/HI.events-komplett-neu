<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Venue extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'organizer_id', 'name', 'description', 'address', 'city',
        'state', 'zip', 'country', 'latitude', 'longitude',
        'capacity', 'website', 'phone', 'email', 'image', 'is_online',
    ];

    protected function casts(): array
    {
        return [
            'latitude'  => 'decimal:8',
            'longitude' => 'decimal:8',
            'is_online' => 'boolean',
        ];
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(Organizer::class);
    }

    public function events(): HasMany
    {
        return $this->hasMany(Event::class);
    }
}
