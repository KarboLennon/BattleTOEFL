<?php

namespace Database\Seeders;

use App\Models\Question;
use Illuminate\Database\Seeder;

class QuestionSeeder extends Seeder
{
    public function run(): void
    {
        $questions = [
            [
                'question'       => 'She ______ to the store every morning.',
                'options'        => ['A' => 'go', 'B' => 'goes', 'C' => 'going', 'D' => 'gone'],
                'correct_answer' => 'B',
                'explanation'    => 'Subject "she" is third person singular, so the verb takes -s.',
            ],
            [
                'question'       => 'Neither the students nor the teacher ______ present.',
                'options'        => ['A' => 'were', 'B' => 'are', 'C' => 'was', 'D' => 'been'],
                'correct_answer' => 'C',
                'explanation'    => '"Neither...nor" uses the verb that agrees with the closer subject "teacher" (singular).',
            ],
            [
                'question'       => 'It is essential that every student ______ the examination.',
                'options'        => ['A' => 'passes', 'B' => 'pass', 'C' => 'passed', 'D' => 'passing'],
                'correct_answer' => 'B',
                'explanation'    => 'After "essential that," the subjunctive mood requires the base form of the verb.',
            ],
            [
                'question'       => 'The committee ______ its decision yesterday.',
                'options'        => ['A' => 'announce', 'B' => 'announces', 'C' => 'announced', 'D' => 'announcing'],
                'correct_answer' => 'C',
                'explanation'    => '"Yesterday" indicates past tense.',
            ],
            [
                'question'       => 'He has been working here ______ five years.',
                'options'        => ['A' => 'since', 'B' => 'for', 'C' => 'during', 'D' => 'from'],
                'correct_answer' => 'B',
                'explanation'    => '"For" is used with a period of time (five years), while "since" is used with a point in time.',
            ],
            [
                'question'       => 'The news ______ very surprising to everyone.',
                'options'        => ['A' => 'were', 'B' => 'are', 'C' => 'was', 'D' => 'have been'],
                'correct_answer' => 'C',
                'explanation'    => '"News" is an uncountable noun and takes a singular verb.',
            ],
            [
                'question'       => 'By the time she arrived, the meeting ______.',
                'options'        => ['A' => 'already ended', 'B' => 'has already ended', 'C' => 'had already ended', 'D' => 'already ends'],
                'correct_answer' => 'C',
                'explanation'    => 'Past perfect is used for an action completed before another past action.',
            ],
            [
                'question'       => '______ he studied hard, he failed the exam.',
                'options'        => ['A' => 'Although', 'B' => 'Because', 'C' => 'So', 'D' => 'Therefore'],
                'correct_answer' => 'A',
                'explanation'    => '"Although" introduces a contrast (studied hard but failed).',
            ],
            [
                'question'       => 'The book on the shelves ______ written by a famous author.',
                'options'        => ['A' => 'were', 'B' => 'are', 'C' => 'was', 'D' => 'have been'],
                'correct_answer' => 'C',
                'explanation'    => 'The subject is "the book" (singular), not "shelves."',
            ],
            [
                'question'       => 'I would have helped him if he ______ asked.',
                'options'        => ['A' => 'had', 'B' => 'has', 'C' => 'have', 'D' => 'would'],
                'correct_answer' => 'A',
                'explanation'    => 'Third conditional uses "had + past participle" in the if-clause.',
            ],
            [
                'question'       => 'The students were told ______ quietly in the library.',
                'options'        => ['A' => 'study', 'B' => 'studied', 'C' => 'to study', 'D' => 'studying'],
                'correct_answer' => 'C',
                'explanation'    => 'After "told," an infinitive (to + verb) is used.',
            ],
            [
                'question'       => 'Not only ______ she pass the test, but she also got the highest score.',
                'options'        => ['A' => 'did', 'B' => 'does', 'C' => 'had', 'D' => 'has'],
                'correct_answer' => 'A',
                'explanation'    => 'Inverted structure after "Not only" requires auxiliary verb before subject.',
            ],
            [
                'question'       => 'Water ______ at 100 degrees Celsius.',
                'options'        => ['A' => 'boil', 'B' => 'boils', 'C' => 'boiled', 'D' => 'is boiling'],
                'correct_answer' => 'B',
                'explanation'    => 'Scientific facts use simple present tense with third-person singular -s.',
            ],
            [
                'question'       => 'The teacher, along with her students, ______ the field trip.',
                'options'        => ['A' => 'enjoy', 'B' => 'enjoys', 'C' => 'enjoyed', 'D' => 'enjoying'],
                'correct_answer' => 'C',
                'explanation'    => 'Subject "teacher" is singular; past tense required based on context.',
            ],
            [
                'question'       => 'Each of the boys ______ a bicycle.',
                'options'        => ['A' => 'have', 'B' => 'has', 'C' => 'had been', 'D' => 'were having'],
                'correct_answer' => 'B',
                'explanation'    => '"Each" always takes a singular verb.',
            ],
            [
                'question'       => 'She speaks English ______ than her brother.',
                'options'        => ['A' => 'more fluent', 'B' => 'more fluently', 'C' => 'fluenter', 'D' => 'most fluently'],
                'correct_answer' => 'B',
                'explanation'    => 'Adverbs (fluently) modify verbs; comparative form uses "more."',
            ],
            [
                'question'       => 'The data ______ been collected over the past decade.',
                'options'        => ['A' => 'has', 'B' => 'have', 'C' => 'had', 'D' => 'having'],
                'correct_answer' => 'B',
                'explanation'    => '"Data" is a plural noun (singular: datum) and takes a plural verb.',
            ],
            [
                'question'       => 'Many of the houses in the area ______ last year.',
                'options'        => ['A' => 'built', 'B' => 'was built', 'C' => 'were built', 'D' => 'have been built'],
                'correct_answer' => 'C',
                'explanation'    => 'Plural "houses" + passive voice + past time marker "last year."',
            ],
            [
                'question'       => '______ arriving at the station, he realized he had forgotten his ticket.',
                'options'        => ['A' => 'After', 'B' => 'While', 'C' => 'Before', 'D' => 'On'],
                'correct_answer' => 'D',
                'explanation'    => '"On + gerund" expresses a moment immediately upon completing an action.',
            ],
            [
                'question'       => 'The harder she worked, ______ she became.',
                'options'        => ['A' => 'the more successful', 'B' => 'the most successful', 'C' => 'more successful', 'D' => 'most successful'],
                'correct_answer' => 'A',
                'explanation'    => 'The "the...the" parallel comparative structure requires "the more successful."',
            ],
            [
                'question'       => 'He insisted that she ______ the report by Monday.',
                'options'        => ['A' => 'submits', 'B' => 'submitted', 'C' => 'submit', 'D' => 'will submit'],
                'correct_answer' => 'C',
                'explanation'    => '"Insisted that" triggers the subjunctive mood (base form of verb).',
            ],
            [
                'question'       => 'The police ______ investigating the crime since last Tuesday.',
                'options'        => ['A' => 'has been', 'B' => 'have been', 'C' => 'had been', 'D' => 'are'],
                'correct_answer' => 'B',
                'explanation'    => '"Police" is a plural noun and takes a plural verb; present perfect continuous applies.',
            ],
            [
                'question'       => 'Seldom ______ such a spectacular display of fireworks.',
                'options'        => ['A' => 'I have seen', 'B' => 'have I seen', 'C' => 'I had seen', 'D' => 'had I seen'],
                'correct_answer' => 'B',
                'explanation'    => 'Inversion is required after negative/restrictive adverbs like "seldom."',
            ],
            [
                'question'       => 'The equipment in all the laboratories ______ to be replaced.',
                'options'        => ['A' => 'need', 'B' => 'needs', 'C' => 'are needing', 'D' => 'have needed'],
                'correct_answer' => 'B',
                'explanation'    => '"Equipment" is uncountable (singular); prepositional phrase doesn\'t change the subject.',
            ],
            [
                'question'       => 'Despite ______ several warnings, he continued to violate the rules.',
                'options'        => ['A' => 'receive', 'B' => 'received', 'C' => 'receiving', 'D' => 'to receive'],
                'correct_answer' => 'C',
                'explanation'    => '"Despite" is a preposition and must be followed by a noun/gerund (-ing form).',
            ],
        ];

        foreach ($questions as $q) {
            Question::create($q);
        }
    }
}
