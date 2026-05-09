<?php

namespace App\Events;

use App\Models\Game;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class GameEnded implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Game $game) {}

    public function broadcastOn(): array
    {
        return [new Channel('room.' . $this->game->room->code)];
    }

    public function broadcastAs(): string
    {
        return 'game.ended';
    }

    public function broadcastWith(): array
    {
        $scores = $this->game->scores()->with('player')->get()->map(fn($s) => [
            'rank'          => $s->rank,
            'player_id'     => $s->player_id,
            'player_name'   => $s->player->name,
            'player_photo'  => $s->player->photo_path,
            'score'         => $s->score,
            'correct_count' => $s->correct_count,
        ]);

        return [
            'game_id'  => $this->game->id,
            'ended_at' => $this->game->ended_at,
            'scores'   => $scores,
        ];
    }
}
