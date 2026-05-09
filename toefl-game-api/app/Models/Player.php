<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Player extends Model
{
    protected $fillable = ['name', 'photo_path', 'session_token'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($player) {
            $player->session_token = Str::random(64);
        });
    }

    public function rooms()
    {
        return $this->belongsToMany(Room::class, 'room_participants', 'player_id', 'room_id')
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    public function scores()
    {
        return $this->hasMany(Score::class);
    }
}
