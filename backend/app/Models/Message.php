<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Message extends Model
{
    protected $fillable = [
        'event_id', 'user_id', 'subject', 'body',
        'type', 'status', 'sent_at', 'recipient_filter', 'recipients_count',
    ];

    protected function casts(): array
    {
        return [
            'sent_at'          => 'datetime',
            'recipient_filter' => 'array',
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
}
