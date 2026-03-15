<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;

class CheckInList extends Model
{
    protected $table    = 'check_in_lists';
    protected $fillable = ['event_id', 'name', 'description', 'short_code', 'is_active'];

    protected function casts(): array
    {
        return ['is_active' => 'boolean'];
    }

    public function event(): BelongsTo
    {
        return $this->belongsTo(Event::class);
    }

    public function ticketTypes(): BelongsToMany
    {
        return $this->belongsToMany(
            TicketType::class,
            'check_in_list_ticket_types',
            'check_in_list_id',
            'ticket_type_id'
        );
    }

    public function attendees()
    {
        return $this->event->attendees()
            ->whereHas('ticketType', fn($q) =>
                $q->whereIn('id', $this->ticketTypes()->pluck('ticket_types.id'))
            );
    }
}
