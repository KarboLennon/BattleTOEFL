<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameStarted implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Game $game) {}

    public function broadcastOn(): array
    {
        return [new Channel('room.' . $this->game->room->code)];
    }

    public function broadcastAs(): string
    {
        return 'game.started';
    }

    public function broadcastWith(): array
    {
        $questions = $this->game->questions()->get()->map(fn($q) => [
            'id'       => $q->id,
            'question' => $q->question,
            'options'  => $q->options,
            'order'    => $q->pivot->order,
        ]);

        return [
            'game_id'    => $this->game->id,
            'started_at' => $this->game->started_at,
            'questions'  => $questions,
        ];
    }
}
