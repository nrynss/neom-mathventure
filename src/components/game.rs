use wasm_bindgen::prelude::*;
use rand::Rng;
use serde::{Serialize, Deserialize};
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
        }
    }

    pub fn generate_question(&mut self) -> String {
        let mut rng = rand::thread_rng();
        let operations = match self.difficulty_level {
            1 => vec!['+'],
            2 => vec!['+', '-'],
            _ => vec!['+', '-', '*'],
        };
        
        let operation = operations[rng.gen_range(0..operations.len())];
        
        // Adjust number range based on difficulty
        let range = 5 * self.difficulty_level;
        let first = rng.gen_range(1..=range);
        let second = match operation {
            '-' => rng.gen_range(1..=first), // Ensure positive results
            '*' => rng.gen_range(1..=range/2), // Keep multiplications manageable
            _ => rng.gen_range(1..=range),
        };
        
        let correct_answer = match operation {
            '+' => first + second,
            '-' => first - second,
            '*' => first * second,
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
            false
        }
    }

    pub fn get_score(&self) -> i32 {
        self.current_score
    }

    pub fn get_high_score(&self) -> i32 {
        self.high_score
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

    pub fn reset_game(&mut self) {
        self.current_score = 0;
        self.difficulty_level = 1;
        self.consecutive_correct = 0;
        self.total_questions = 0;
        self.correct_answers = 0;
        // Don't reset high score as it should persist
    }
}