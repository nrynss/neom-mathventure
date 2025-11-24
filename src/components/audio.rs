use wasm_bindgen::prelude::*;
use web_sys::{window, SpeechSynthesisUtterance};

#[wasm_bindgen]
pub struct AudioManager {
    enabled: bool,
}

#[wasm_bindgen]
impl AudioManager {
    #[wasm_bindgen(constructor)]
    pub fn new() -> AudioManager {
        AudioManager { enabled: true }
    }

    pub fn toggle(&mut self) -> bool {
        self.enabled = !self.enabled;
        self.enabled
    }

    pub fn speak(&self, text: &str) {
        self.speak_with_pitch(text, 1.0);
    }

    pub fn speak_with_pitch(&self, text: &str, pitch: f32) {
        if !self.enabled {
            return;
        }

        if let Some(win) = window() {
            if let Ok(speech_synthesis) = win.speech_synthesis() {
                if let Ok(utterance) = SpeechSynthesisUtterance::new_with_text(text) {
                    utterance.set_pitch(pitch);
                    let _ = speech_synthesis.speak(&utterance);
                }
            }
        }
    }
}
