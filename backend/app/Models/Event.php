<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Event extends Model
{
    use HasFactory, SoftDeletes;

    protected $fillable = [
        'organizer_id', 'venue_id', 'category_id', 'title', 'slug',
        'description', 'short_description', 'start_date', 'end_date',
        'timezone', 'status', 'visibility', 'cover_image', 'banner_image',
        'max_attendees', 'is_online', 'online_url', 'website', 'tags',
        'meta', 'currency', 'is_featured', 'views_count',
    ];

    protected function casts(): array
    {
        return [
            'start_date'   => 'datetime',
            'end_date'     => 'datetime',
            'is_online'    => 'boolean',
            'is_featured'  => 'boolean',
            'tags'         => 'array',
            'meta'         => 'array',
        ];
    }

    public function organizer(): BelongsTo
    {
        return $this->belongsTo(Organizer::class);
    }

    public function venue(): BelongsTo
    {
        return $this->belongsTo(Venue::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(EventCategory::class, 'category_id');
    }

    public function ticketTypes(): HasMany
    {
        return $this->hasMany(TicketType::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function attendees(): HasMany
    {
        return $this->hasMany(Attendee::class);
    }

    public function promoCodes(): HasMany
    {
        return $this->hasMany(PromoCode::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(EventImage::class);
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class);
    }

    public function checkInLists(): HasMany
    {
        return $this->hasMany(CheckInList::class);
    }
}
