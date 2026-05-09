<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Player;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PlayerController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'name'  => 'required|string|max:30',
            'photo' => 'required|string', // base64 data URL
        ]);

        $imageData = $request->photo;
        if (preg_match('/^data:image\/(\w+);base64,/', $imageData, $matches)) {
            $imageData = substr($imageData, strpos($imageData, ',') + 1);
        }

        $decoded = base64_decode($imageData);
        $filename = 'selfies/' . uniqid('player_', true) . '.jpg';
        Storage::disk('public')->put($filename, $decoded);

        $player = Player::create([
            'name'       => $request->name,
            'photo_path' => $filename,
        ]);

        return response()->json([
            'player'        => $player,
            'session_token' => $player->session_token,
            'photo_url'     => Storage::disk('public')->url($filename),
        ], 201);
    }

    public function me(Request $request)
    {
        $token = $request->header('X-Player-Token');
        $player = Player::where('session_token', $token)->firstOrFail();

        return response()->json([
            'player'    => $player,
            'photo_url' => Storage::disk('public')->url($player->photo_path),
        ]);
    }
}
