use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use web_sys::{AudioContext, OscillatorType, GainNode};

#[wasm_bindgen]
pub struct MusicGenerator {
    audio_context: Option<AudioContext>,
    master_gain: Option<GainNode>,
    is_playing: bool,
    current_note: usize,
}

#[wasm_bindgen]
impl MusicGenerator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        MusicGenerator {
            audio_context: None,
            master_gain: None,
            is_playing: false,
            current_note: 0,
        }
    }

    fn initialize(&mut self) {
        if self.audio_context.is_none() {
            if let Ok(ctx) = AudioContext::new() {
                if let Ok(gain) = ctx.create_gain() {
                    let _ = gain.gain().set_value(0.12);
                    let _ = gain.connect_with_audio_node(&ctx.destination());
                    self.master_gain = Some(gain);
                }
                self.audio_context = Some(ctx);
            }
        }
    }

    fn play_note(&self, frequency: f32, start_time: f64, duration: f64) {
        if let (Some(ctx), Some(master_gain)) = (&self.audio_context, &self.master_gain) {
            if let Ok(osc) = ctx.create_oscillator() {
                if let Ok(gain) = ctx.create_gain() {
                    let _ = osc.set_type(OscillatorType::Sine);
                    let _ = osc.frequency().set_value(frequency);
                    
                    // ADSR envelope
                    let _ = gain.gain().set_value_at_time(0.0, start_time);
                    let _ = gain.gain().linear_ramp_to_value_at_time(0.3, start_time + 0.05);
                    let _ = gain.gain().linear_ramp_to_value_at_time(0.2, start_time + 0.1);
                    let _ = gain.gain().set_value_at_time(0.2, start_time + duration - 0.1);
                    let _ = gain.gain().linear_ramp_to_value_at_time(0.0, start_time + duration);
                    
                    let _ = osc.connect_with_audio_node(&gain);
                    let _ = gain.connect_with_audio_node(master_gain);
                    
                    let _ = osc.start_with_when(start_time);
                    let _ = osc.stop_with_when(start_time + duration);
                }
            }
        }
    }

    pub fn start(&mut self) {
        if self.is_playing {
            return;
        }

        self.initialize();
        
        if let Some(ctx) = &self.audio_context {
            let _ = ctx.resume();
        }

        self.is_playing = true;
        self.current_note = 0;
        self.schedule_next_batch();
        // JavaScript will handle the interval for continuous scheduling
    }

    fn schedule_next_batch(&mut self) {
        if !self.is_playing {
            return;
        }

        if let Some(ctx) = &self.audio_context {
            // Pentatonic scale: C4, D4, E4, G4, A4, C5
            let scale = [261.63, 293.66, 329.63, 392.00, 440.00, 523.25];
            
            // Pleasant melodic pattern (repeats every 8 notes)
            let pattern = [0, 2, 4, 2, 1, 3, 4, 0];
            
            let current_time = ctx.current_time();
            let tempo = 120.0; // BPM
            let seconds_per_beat = 60.0 / tempo;
            let note_duration = 0.45;
            
            // Schedule next 8 notes (4 seconds of music)
            for i in 0..8 {
                let note_idx = (self.current_note + i) % pattern.len();
                let scale_idx = pattern[note_idx];
                let frequency = scale[scale_idx];
                let start_time = current_time + (i as f64 * seconds_per_beat);
                
                self.play_note(frequency, start_time, note_duration);
            }
            
            self.current_note = (self.current_note + 8) % pattern.len();
        }
    }

    pub fn schedule_more_notes(&mut self) {
        if self.is_playing {
            self.schedule_next_batch();
        }
    }

    pub fn stop(&mut self) {
        self.is_playing = false;
        
        // Disconnect audio context
        if let Some(gain) = &self.master_gain {
            let _ = gain.disconnect();
        }
        
        self.audio_context = None;
        self.master_gain = None;
    }

    pub fn is_playing(&self) -> bool {
        self.is_playing
    }
}
