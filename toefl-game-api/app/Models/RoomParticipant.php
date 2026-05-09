<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RoomParticipant extends Model
{
    protected $fillable = ['room_id', 'player_id', 'joined_at'];
}
