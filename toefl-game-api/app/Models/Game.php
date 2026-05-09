<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Game extends Model
{
    protected $fillable = ['room_id', 'started_at', 'ended_at'];

    protected $casts = [
        'started_at' => 'datetime',
        'ended_at'   => 'datetime',
    ];

    public function room()
    {
        return $this->belongsTo(Room::class);
    }

    public function questions()
    {
        return $this->belongsToMany(Question::class, 'game_questions')
            ->withPivot('order')
            ->orderByPivot('order');
    }

    public function scores()
    {
        return $this->hasMany(Score::class)->orderBy('rank');
    }

    public function answers()
    {
        return $this->hasMany(Answer::class);
    }
}
