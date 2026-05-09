<?php

use App\Http\Controllers\Api\GameController;
use App\Http\Controllers\Api\PlayerController;
use App\Http\Controllers\Api\RoomController;
use Illuminate\Support\Facades\Route;

Route::post('/players/register', [PlayerController::class, 'register']);
Route::get('/players/me', [PlayerController::class, 'me']);

Route::post('/rooms', [RoomController::class, 'create']);
Route::post('/rooms/{code}/join', [RoomController::class, 'join']);
Route::get('/rooms/{code}', [RoomController::class, 'show']);

Route::get('/rooms/{code}/game', [GameController::class, 'currentGame']);
Route::post('/rooms/{code}/start', [GameController::class, 'start']);
Route::post('/rooms/{code}/finish', [GameController::class, 'finish']);
Route::post('/games/{gameId}/answer', [GameController::class, 'submitAnswer']);
Route::get('/games/{gameId}/questions/{questionId}/status', [GameController::class, 'questionStatus']);
Route::get('/games/{gameId}/scores', [GameController::class, 'scores']);
