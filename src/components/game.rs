use rand::Rng;
use serde::{Deserialize, Serialize};
use wasm_bindgen::prelude::*;
use web_sys::console;

#[derive(Serialize, Deserialize)]
pub struct Question {
    first_number: i32,
    second_number: i32,
    operation: char,
    correct_answer: i32,
    difficulty_level: i32,
}

#[wasm_bindgen]
pub struct NeomMathGame {
    current_score: i32,
    current_question: Option<Question>,
    difficulty_level: i32,
    high_score: i32,
    consecutive_correct: i32,
    total_questions: i32,
    correct_answers: i32,
    rng: rand::rngs::ThreadRng, // Store RNG for reuse
}

#[wasm_bindgen]
impl NeomMathGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> NeomMathGame {
        NeomMathGame {
            current_score: 0,
            current_question: None,
            difficulty_level: 1,
            high_score: 0,
            consecutive_correct: 0,
            total_questions: 0,
            correct_answers: 0,
            rng: rand::thread_rng(), // Initialize once
        }
    }

    pub fn generate_question(&mut self) -> String {
        let operations = match self.difficulty_level {
            1 => vec!['+'],
            2 => vec!['+', '-'],
            3 => vec!['+', '-', '*'],
            _ => vec!['+', '-', '*', '/'], // Added division for higher levels
        };

        let operation = operations[self.rng.gen_range(0..operations.len())];

        // Adjust number range based on difficulty
        let range = 5 * self.difficulty_level;

        // Generate numbers based on operation
        let (first, second, correct_answer) = match operation {
            '+' => {
                let first = self.rng.gen_range(1..=range);
                let second = self.rng.gen_range(1..=range);
                (first, second, first + second)
            }
            '-' => {
                let first = self.rng.gen_range(1..=range);
                let second = self.rng.gen_range(1..=first); // Ensure positive results
                (first, second, first - second)
            }
            '*' => {
                let first = self.rng.gen_range(1..=range);
                let second = self.rng.gen_range(1..=range / 2); // Keep multiplications manageable
                (first, second, first * second)
            }
            '/' => {
                // Generate division with whole number result
                let second = self.rng.gen_range(1..=(range / 2).max(1));
                let correct_answer = self.rng.gen_range(1..=(range / second).max(1));
                let first = correct_answer * second;
                (first, second, correct_answer)
            }
            _ => unreachable!(),
        };

        let question = Question {
            first_number: first,
            second_number: second,
            operation,
            correct_answer,
            difficulty_level: self.difficulty_level,
        };

        self.current_question = Some(question);
        self.total_questions += 1;

        format!("{} {} {}", first, operation, second)
    }

    pub fn check_answer(&mut self, user_answer: i32) -> bool {
        if let Some(question) = &self.current_question {
            let correct = user_answer == question.correct_answer;

            if correct {
                self.current_score += self.difficulty_level * 10;
                self.consecutive_correct += 1;
                self.correct_answers += 1;

                // Increase difficulty every 5 consecutive correct answers
                if self.consecutive_correct >= 5 {
                    self.difficulty_level += 1;
                    self.consecutive_correct = 0;
                    console::log_1(&"Level Up!".into());
                }

                // Update high score
                if self.current_score > self.high_score {
                    self.high_score = self.current_score;
                }
            } else {
                self.consecutive_correct = 0;
            }

            correct
        } else {
            console::log_1(&"Error: Attempting to check answer without active question".into());
            false
        }
    }

    pub fn get_score(&self) -> i32 {
        self.current_score
    }

    pub fn get_high_score(&self) -> i32 {
        self.high_score
    }

    #[wasm_bindgen]
    pub fn set_high_score(&mut self, score: i32) {
        // For loading saved high scores
        self.high_score = score;
    }

    pub fn get_difficulty(&self) -> i32 {
        self.difficulty_level
    }

    pub fn get_accuracy(&self) -> f64 {
        if self.total_questions == 0 {
            0.0
        } else {
            (self.correct_answers as f64 / self.total_questions as f64 * 100.0).round()
        }
    }

    pub fn get_correct_answer(&self) -> Option<i32> {
        self.current_question.as_ref().map(|q| q.correct_answer)
    }

    pub fn reset_game(&mut self) {
        self.current_score = 0;
        self.difficulty_level = 1;
        self.consecutive_correct = 0;
        self.total_questions = 0;
        self.correct_answers = 0;
        // Don't reset high score as it should persist
    }
}
