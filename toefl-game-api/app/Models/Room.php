<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Room extends Model
{
    protected $fillable = ['code', 'host_id', 'status'];

    protected static function boot(): void
    {
        parent::boot();
        static::creating(function ($room) {
            do {
                $code = strtoupper(\Illuminate\Support\Str::random(6));
            } while (self::where('code', $code)->exists());
            $room->code = $code;
        });
    }

    public function host()
    {
        return $this->belongsTo(Player::class, 'host_id');
    }

    public function participants()
    {
        return $this->belongsToMany(Player::class, 'room_participants', 'room_id', 'player_id')
            ->withPivot('joined_at')
            ->withTimestamps();
    }

    public function game()
    {
        return $this->hasOne(Game::class);
    }

    public function isWaiting(): bool
    {
        return $this->status === 'waiting';
    }
}
