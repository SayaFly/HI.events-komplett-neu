<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Message;
use App\Models\Event;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MessageController extends Controller
{
    public function index(Event $event): JsonResponse
    {
        $messages = Message::where('event_id', $event->id)->latest()->paginate(20);

        return response()->json($messages);
    }

    public function store(Request $request, Event $event): JsonResponse
    {
        $data = $request->validate([
            'subject'          => ['required', 'string', 'max:500'],
            'body'             => ['required', 'string'],
            'type'             => ['nullable', 'in:email,sms'],
            'recipient_filter' => ['nullable', 'array'],
        ]);

        $data['event_id'] = $event->id;
        $data['user_id']  = $request->user()->id;
        $data['status']   = 'draft';

        $message = Message::create($data);

        return response()->json($message, 201);
    }

    public function show(Message $message): JsonResponse
    {
        return response()->json($message);
    }

    public function destroy(Message $message): JsonResponse
    {
        abort_if($message->status === 'sent', 422, 'Gesendete Nachrichten können nicht gelöscht werden.');
        $message->delete();

        return response()->json(null, 204);
    }

    public function send(Request $request, Message $message): JsonResponse
    {
        abort_if($message->status === 'sent', 422, 'Nachricht wurde bereits gesendet.');

        // Hier würde der tatsächliche Versand via Queue stattfinden
        $message->update([
            'status'           => 'sent',
            'sent_at'          => now(),
            'recipients_count' => $this->countRecipients($message),
        ]);

        return response()->json([
            'message' => 'Nachricht wird gesendet.',
            'data'    => $message->fresh(),
        ]);
    }

    private function countRecipients(Message $message): int
    {
        $query = \App\Models\Attendee::where('event_id', $message->event_id)
            ->where('status', '!=', 'cancelled');

        return $query->distinct('email')->count('email');
    }
}
