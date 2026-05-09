<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Score extends Model
{
    protected $fillable = ['game_id', 'player_id', 'correct_count', 'score', 'rank'];

    public function player()
    {
        return $this->belongsTo(Player::class);
    }
}
