use crate::components::audio::AudioManager;
use crate::components::localization::LocalizationManager;
use crate::components::music::MusicGenerator;
use wasm_bindgen::prelude::*;
use web_sys::window;
use rand::Rng;

#[derive(Clone, Copy)]
enum Operation {
    Add,
    Subtract,
    Multiply,
    Divide,
}

struct Question {
    text: String,
    answer: i32,
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
    time_left: i32,
    max_time: i32,
    rng: rand::rngs::ThreadRng,
    audio: AudioManager,
    localization: LocalizationManager,
    music: MusicGenerator,
}

#[wasm_bindgen]
impl NeomMathGame {
    #[wasm_bindgen(constructor)]
    pub fn new() -> NeomMathGame {
        let mut game = NeomMathGame {
            current_score: 0,
            current_question: None,
            difficulty_level: 1,
            high_score: 0,
            consecutive_correct: 0,
            total_questions: 0,
            correct_answers: 0,
            time_left: 30,
            max_time: 30,
            rng: rand::thread_rng(),
            audio: AudioManager::new(),
            localization: LocalizationManager::new(),
            music: MusicGenerator::new(),
        };
        game.load_high_score();
        game
    }

    pub fn load_locales(&mut self, json_str: &str) {
        if let Err(e) = self.localization.load_translations(json_str) {
            web_sys::console::error_1(&format!("Error loading locales: {}", e).into());
        }
    }

    pub fn get_ui_text(&self, key: &str) -> String {
        self.localization.get_text(key)
    }

    pub fn get_mascot_message(&self, mascot: &str, category: &str) -> String {
        let path = format!("mascots.{}.{}", mascot, category);
        self.localization.get_random_phrase(&path)
    }

    pub fn toggle_audio(&mut self) -> bool {
        self.audio.toggle()
    }

    pub fn speak_mascot_message(&self, text: &str, mascot: &str) {
        let pitch = if mascot == "thangamma" { 1.2 } else { 0.8 };
        self.audio.speak_with_pitch(text, pitch);
    }

    pub fn start_music(&mut self) {
        self.music.start();
    }

    pub fn stop_music(&mut self) {
        self.music.stop();
    }

    pub fn is_music_playing(&self) -> bool {
        self.music.is_playing()
    }

    pub fn reset_game(&mut self) {
        self.current_score = 0;
        self.difficulty_level = 1;
        self.consecutive_correct = 0;
        self.total_questions = 0;
        self.correct_answers = 0;
        self.time_left = 30;
        self.max_time = 30;
        self.current_question = None;
    }

    pub fn generate_question(&mut self) -> String {
        let (num1, num2, op) = self.create_question_params();
        
        let (question_text, answer) = match op {
            Operation::Add => (format!("{} + {}", num1, num2), num1 + num2),
            Operation::Subtract => {
                let (n1, n2) = if num1 >= num2 { (num1, num2) } else { (num2, num1) };
                (format!("{} - {}", n1, n2), n1 - n2)
            },
            Operation::Multiply => (format!("{} × {}", num1, num2), num1 * num2),
            Operation::Divide => {
                let product = num1 * num2;
                (format!("{} ÷ {}", product, num1), num2)
            },
        };

        self.current_question = Some(Question {
            text: question_text.clone(),
            answer,
        });
        
        self.total_questions += 1;
        question_text
    }

    fn create_question_params(&mut self) -> (i32, i32, Operation) {
        let operations = match self.difficulty_level {
            1 => vec![Operation::Add],
            2 => vec![Operation::Add, Operation::Subtract],
            3 => vec![Operation::Add, Operation::Subtract, Operation::Multiply],
            _ => vec![Operation::Add, Operation::Subtract, Operation::Multiply, Operation::Divide],
        };

        let operation = operations[self.rng.gen_range(0..operations.len())];
        
        let range_max = match self.difficulty_level {
            1 => 10,
            2 => 20,
            3 => 50,
            _ => 100,
        };

        let num1 = self.rng.gen_range(1..=range_max);
        let num2 = self.rng.gen_range(1..=range_max);

        (num1, num2, operation)
    }

    pub fn check_answer(&mut self, user_answer: i32) -> bool {
        if let Some(q) = &self.current_question {
            if user_answer == q.answer {
                self.handle_correct_answer();
                return true;
            }
        }
        self.consecutive_correct = 0;
        false
    }

    fn handle_correct_answer(&mut self) {
        self.current_score += 10 * self.difficulty_level;
        self.correct_answers += 1;
        self.consecutive_correct += 1;
        
        self.time_left = (self.time_left + 2).min(self.max_time);

        if self.consecutive_correct >= 3 {
            self.difficulty_level += 1;
            self.consecutive_correct = 0;
            self.max_time = (self.max_time - 2).max(10);
        }

        if self.current_score > self.high_score {
            self.high_score = self.current_score;
            self.save_high_score();
        }
    }

    pub fn get_score(&self) -> i32 {
        self.current_score
    }

    pub fn get_difficulty(&self) -> i32 {
        self.difficulty_level
    }

    pub fn get_high_score(&self) -> i32 {
        self.high_score
    }

    pub fn get_accuracy(&self) -> i32 {
        if self.total_questions == 0 {
            0
        } else {
            (self.correct_answers as f32 / self.total_questions as f32 * 100.0) as i32
        }
    }

    pub fn tick(&mut self) -> bool {
        if self.time_left > 0 {
            self.time_left -= 1;
            true
        } else {
            false
        }
    }

    pub fn get_time_left(&self) -> i32 {
        self.time_left
    }

    fn load_high_score(&mut self) {
        if let Some(win) = window() {
            if let Ok(Some(storage)) = win.local_storage() {
                if let Ok(Some(score_str)) = storage.get_item("neom_mathventure_highscore") {
                    if let Ok(score) = score_str.parse() {
                        self.high_score = score;
                    }
                }
            }
        }
    }

    fn save_high_score(&self) {
        if let Some(win) = window() {
            if let Ok(Some(storage)) = win.local_storage() {
                let _ = storage.set_item("neom_mathventure_highscore", &self.high_score.to_string());
            }
        }
    }
}
