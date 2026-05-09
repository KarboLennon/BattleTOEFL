<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use App\Models\Room;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class RoomController extends Controller
{
    private function resolvePlayer(Request $request): Player
    {
        $token = $request->header('X-Player-Token');
        $player = Player::where('session_token', $token)->first();
        if (!$player) abort(401, 'Sesi tidak valid. Silakan daftar ulang.');
        return $player;
    }

    public function create(Request $request)
    {
        $player = $this->resolvePlayer($request);

        $room = Room::create(['host_id' => $player->id]);
        $room->participants()->attach($player->id, ['joined_at' => now()]);

        return response()->json($this->roomData($room, $player), 201);
    }

    public function join(Request $request, string $code)
    {
        $player = $this->resolvePlayer($request);
        $room   = Room::where('code', strtoupper($code))->firstOrFail();

        if (!$room->isWaiting()) {
            return response()->json(['message' => 'Battle sudah dimulai, tidak bisa join!'], 403);
        }

        $room->participants()->syncWithoutDetaching([$player->id => ['joined_at' => now()]]);

        return response()->json($this->roomData($room, $player));
    }

    public function show(Request $request, string $code)
    {
        $player = $this->resolvePlayer($request);
        $room   = Room::where('code', strtoupper($code))->with('participants')->firstOrFail();

        return response()->json($this->roomData($room, $player));
    }

    private function roomData(Room $room, Player $currentPlayer): array
    {
        $room->load('participants', 'host');

        return [
            'room' => [
                'id'      => $room->id,
                'code'    => $room->code,
                'status'  => $room->status,
                'host_id' => $room->host_id,
            ],
            'participants' => $room->participants->map(fn($p) => [
                'id'        => $p->id,
                'name'      => $p->name,
                'photo_url' => Storage::disk('public')->url($p->photo_path),
                'is_host'   => $p->id === $room->host_id,
            ]),
            'is_host' => $currentPlayer->id === $room->host_id,
        ];
    }
}
