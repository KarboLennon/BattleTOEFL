<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Answer;
use App\Models\Game;
use App\Models\Player;
use App\Models\Question;
use App\Models\Room;
use App\Models\Score;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class GameController extends Controller
{
    private function resolvePlayer(Request $request): Player
    {
        $token = $request->header('X-Player-Token');
        return Player::where('session_token', $token)->firstOrFail();
    }

    public function currentGame(Request $request, string $code)
    {
        $room = Room::where('code', strtoupper($code))->with('game')->firstOrFail();
        $game = $room->game;

        if (!$game) {
            return response()->json(['message' => 'Game belum dimulai'], 404);
        }

        $questions = $game->questions()->get()->map(fn($q) => [
            'id'       => $q->id,
            'question' => $q->question,
            'options'  => $q->options,
            'order'    => $q->pivot->order,
        ]);

        return response()->json([
            'game_id'    => $game->id,
            'started_at' => $game->started_at,
            'ended_at'   => $game->ended_at,
            'questions'  => $questions,
        ]);
    }

    public function start(Request $request, string $code)
    {
        $player = $this->resolvePlayer($request);
        $room   = Room::where('code', strtoupper($code))->firstOrFail();

        if ($room->host_id !== $player->id) {
            return response()->json(['message' => 'Hanya host yang bisa mulai game'], 403);
        }

        if (!$room->isWaiting()) {
            $game = $room->game;
            return response()->json([
                'message' => 'Game sudah berjalan',
                'game_id' => $game?->id,
                'status'  => $room->status,
            ], 409);
        }

        $questions = $this->fetchQuestionsFromGemini() ?? Question::inRandomOrder()->limit(20)->get();

        if ($questions->count() < 20) {
            return response()->json(['message' => 'Soal kurang dari 20. Coba lagi.'], 422);
        }

        $room->update(['status' => 'active']);

        $game = Game::create([
            'room_id'    => $room->id,
            'started_at' => now(),
        ]);

        $questions->each(function ($q, $index) use ($game) {
            $game->questions()->attach($q->id, ['order' => $index + 1]);
        });

        return response()->json(['game_id' => $game->id, 'message' => 'Game dimulai!']);
    }

    private function fetchQuestionsFromGemini(): ?\Illuminate\Support\Collection
    {
        $apiKey = config('services.gemini.key');
        if (!$apiKey) return null;

        $prompt = <<<PROMPT
Generate exactly 20 TOEFL Structure and Written Expression multiple choice questions.
Test English grammar: subject-verb agreement, tenses, conditionals, passive voice, articles, prepositions, reported speech, relative clauses, gerund vs infinitive, subjunctive mood.

Return ONLY a valid JSON array with exactly 20 objects. No markdown, no explanation outside the JSON.
Format:
[
  {
    "question": "She ______ to the store every morning.",
    "options": {"A": "go", "B": "goes", "C": "going", "D": "gone"},
    "correct_answer": "B",
    "explanation": "Third person singular takes -s."
  }
]

Rules:
- Each object must have: question, options (A/B/C/D), correct_answer (A/B/C/D), explanation
- Mix difficulty levels
- No duplicate questions
PROMPT;

        try {
            $response = Http::timeout(30)->post(
                "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-lite:generateContent?key={$apiKey}",
                [
                    'contents' => [['parts' => [['text' => $prompt]]]],
                    'generationConfig' => ['temperature' => 0.8, 'maxOutputTokens' => 4096],
                ]
            );

            if (!$response->successful()) {
                Log::warning('Gemini API error', ['status' => $response->status(), 'body' => $response->body()]);
                return null;
            }

            $text = $response->json('candidates.0.content.parts.0.text') ?? '';

            // Strip markdown code block if present
            $text = preg_replace('/^```(?:json)?\s*/m', '', $text);
            $text = preg_replace('/\s*```$/m', '', $text);
            $text = trim($text);

            $parsed = json_decode($text, true);
            if (!is_array($parsed) || count($parsed) < 20) {
                Log::warning('Gemini returned invalid JSON or < 20 questions');
                return null;
            }

            $created = collect();
            foreach (array_slice($parsed, 0, 20) as $item) {
                if (!isset($item['question'], $item['options'], $item['correct_answer'])) continue;
                $q = Question::create([
                    'question'       => $item['question'],
                    'options'        => $item['options'],
                    'correct_answer' => strtoupper($item['correct_answer']),
                    'explanation'    => $item['explanation'] ?? null,
                ]);
                $created->push($q);
            }

            return $created->count() >= 20 ? $created : null;
        } catch (\Exception $e) {
            Log::error('Gemini fetch failed: ' . $e->getMessage());
            return null;
        }
    }

    public function questionStatus(Request $request, int $gameId, int $questionId)
    {
        $game = Game::with('room.participants')->findOrFail($gameId);

        $answeredIds = Answer::where('game_id', $gameId)
            ->where('question_id', $questionId)
            ->pluck('player_id')
            ->toArray();

        $participants = $game->room->participants->map(fn($p) => [
            'id'          => $p->id,
            'name'        => $p->name,
            'photo_url'   => Storage::disk('public')->url($p->photo_path),
            'has_answered' => in_array($p->id, $answeredIds),
        ]);

        $total = $game->room->participants->count();

        return response()->json([
            'all_answered'   => count($answeredIds) >= $total,
            'answered_count' => count($answeredIds),
            'total_count'    => $total,
            'participants'   => $participants,
        ]);
    }

    public function submitAnswer(Request $request, int $gameId)
    {
        $request->validate([
            'question_id' => 'required|integer',
            'answer'      => 'required|string|in:A,B,C,D',
        ]);

        $player   = $this->resolvePlayer($request);
        $game     = Game::with('questions')->findOrFail($gameId);
        $question = Question::findOrFail($request->question_id);

        $isCorrect = strtoupper($request->answer) === strtoupper($question->correct_answer);

        Answer::updateOrCreate(
            ['game_id' => $gameId, 'player_id' => $player->id, 'question_id' => $question->id],
            ['answer' => $request->answer, 'is_correct' => $isCorrect, 'answered_at' => now()]
        );

        return response()->json(['is_correct' => $isCorrect]);
    }

    public function finish(Request $request, string $code)
    {
        $player = $this->resolvePlayer($request);
        $room   = Room::where('code', strtoupper($code))->with('game')->firstOrFail();
        $game   = $room->game;

        if (!$game || $game->ended_at) {
            return response()->json(['message' => 'Game sudah selesai atau belum dimulai'], 409);
        }

        $game->update(['ended_at' => now()]);
        $room->update(['status' => 'finished']);

        $participants = $room->participants;

        $scores = $participants->map(function ($p) use ($game) {
            $correct = Answer::where('game_id', $game->id)
                ->where('player_id', $p->id)
                ->where('is_correct', true)
                ->count();

            return [
                'player_id'     => $p->id,
                'correct_count' => $correct,
                'score'         => $correct * 5,
            ];
        })->sortByDesc('score')->values();

        $scores->each(function ($s, $index) use ($game) {
            Score::updateOrCreate(
                ['game_id' => $game->id, 'player_id' => $s['player_id']],
                ['correct_count' => $s['correct_count'], 'score' => $s['score'], 'rank' => $index + 1]
            );
        });

        return response()->json(['message' => 'Game selesai!', 'game_id' => $game->id]);
    }

    public function scores(int $gameId)
    {
        $game   = Game::with(['scores.player', 'room'])->findOrFail($gameId);
        $scores = $game->scores->map(fn($s) => [
            'rank'          => $s->rank,
            'player_id'     => $s->player_id,
            'player_name'   => $s->player->name,
            'player_photo'  => asset('storage/' . $s->player->photo_path),
            'score'         => $s->score,
            'correct_count' => $s->correct_count,
        ]);

        return response()->json(['scores' => $scores, 'total_questions' => 20]);
    }
}
