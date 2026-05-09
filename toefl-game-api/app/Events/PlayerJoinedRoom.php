<?php

namespace App\Events;

use App\Models\Player;
use App\Models\Room;
use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Contracts\Broadcasting\ShouldBroadcastNow;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PlayerJoinedRoom implements ShouldBroadcastNow
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public function __construct(public Room $room, public Player $player) {}

    public function broadcastOn(): array
    {
        return [new Channel('room.' . $this->room->code)];
    }

    public function broadcastAs(): string
    {
        return 'player.joined';
    }

    public function broadcastWith(): array
    {
        return [
            'player' => [
                'id'         => $this->player->id,
                'name'       => $this->player->name,
                'photo_path' => $this->player->photo_path,
            ],
            'participant_count' => $this->room->participants()->count(),
        ];
    }
}
