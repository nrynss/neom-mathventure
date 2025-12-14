use wasm_bindgen::prelude::*;
use web_sys::{AudioContext, OscillatorType, GainNode};
use serde::{Deserialize, Serialize};
use gloo_net::http::Request;
use gloo_timers::callback::Interval;
use std::cell::RefCell;
use std::rc::Rc;

use std::collections::HashMap;

#[derive(Serialize, Deserialize, Clone)]
struct NoteData {
    note: String,
    duration: f64,
}

#[derive(Serialize, Deserialize, Clone)]
struct Melody {
    title: String,
    composer: String,
    notes: Vec<NoteData>,
    #[serde(rename = "noteFrequencies")]
    note_frequencies: HashMap<String, f32>,
}

#[wasm_bindgen]
pub struct MusicGenerator {
    audio_context: Option<AudioContext>,
    master_gain: Option<GainNode>,
    is_playing: Rc<RefCell<bool>>,
    current_melody: Rc<RefCell<Option<Melody>>>,
    current_note_index: Rc<RefCell<usize>>,
    interval: Option<Interval>,
}


#[wasm_bindgen]
impl MusicGenerator {
    #[wasm_bindgen(constructor)]
    pub fn new() -> Self {
        MusicGenerator {
            audio_context: None,
            master_gain: None,
            is_playing: Rc::new(RefCell::new(false)),
            current_melody: Rc::new(RefCell::new(None)),
            current_note_index: Rc::new(RefCell::new(0)),
            interval: None,
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

    pub fn load_melody(&mut self, path: &str) {
        let current_melody = self.current_melody.clone();
        let path = path.to_string();
        wasm_bindgen_futures::spawn_local(async move {
            match Request::get(&path).send().await {
                Ok(response) => {
                    if let Ok(melody) = response.json::<Melody>().await {
                        *current_melody.borrow_mut() = Some(melody);
                    }
                },
                Err(_) => {}
            }
        });
    }



    pub fn start(&mut self) {
        if *self.is_playing.borrow() {
            return;
        }

        self.initialize();
        
        if let Some(ctx) = &self.audio_context {
            let _ = ctx.resume();
        }

        *self.is_playing.borrow_mut() = true;
        *self.current_note_index.borrow_mut() = 0;

        // Clones for the async block
        let current_melody = self.current_melody.clone();
        let is_playing = self.is_playing.clone();
        let current_note_index = self.current_note_index.clone();
        
        // Handle Option unwrapping safely or assume initialized
        if self.audio_context.is_none() || self.master_gain.is_none() {
             return;
        }

        let ctx_clone = self.audio_context.as_ref().unwrap().clone();
        let gain_clone = self.master_gain.as_ref().unwrap().clone();

        wasm_bindgen_futures::spawn_local(async move {
            // Load if needed
            if current_melody.borrow().is_none() {
                let path = "music/ode_to_joy.json";
                 match Request::get(path).send().await {
                    Ok(response) => {
                        if let Ok(melody) = response.json::<Melody>().await {
                            *current_melody.borrow_mut() = Some(melody);
                        }
                    },
                    Err(_) => {}
                }
            }

            // Schedule first batch immediately if playing and loaded
            if *is_playing.borrow() {
                if let Some(melody) = &*current_melody.borrow() {
                    let mut idx = current_note_index.borrow_mut();
                    Self::schedule_batch_static(&ctx_clone, &gain_clone, melody, &mut idx);
                }
            }
        });

        // Start interval for subsequent batches
        let is_playing_interval = self.is_playing.clone();
        let current_melody_interval = self.current_melody.clone();
        let current_note_index_interval = self.current_note_index.clone();
        let ctx_interval = self.audio_context.as_ref().unwrap().clone();
        let gain_interval = self.master_gain.as_ref().unwrap().clone();

        self.interval = Some(Interval::new(3000, move || {
            if *is_playing_interval.borrow() {
                if let Some(melody) = &*current_melody_interval.borrow() {
                    let mut idx = current_note_index_interval.borrow_mut();
                    Self::schedule_batch_static(&ctx_interval, &gain_interval, melody, &mut idx);
                }
            }
        }));
    }

    // Helper to be called from the interval
    fn schedule_batch_static(
        ctx: &AudioContext,
        master_gain: &GainNode,
        melody: &Melody,
        note_index: &mut usize,
    ) {
        let current_time = ctx.current_time();
        let mut time_offset = 0.0;
        
        for _ in 0..10 {
            let idx = *note_index % melody.notes.len();
            let note_data = &melody.notes[idx];
            
            if let Some(freq) = melody.note_frequencies.get(&note_data.note) {
                 if let Ok(osc) = ctx.create_oscillator() {
                    if let Ok(gain) = ctx.create_gain() {
                        let _ = osc.set_type(OscillatorType::Sine);
                        let _ = osc.frequency().set_value(*freq);
                        
                        let start = current_time + time_offset;
                        let duration = note_data.duration;
                        
                        let _ = gain.gain().set_value_at_time(0.0, start);
                        let _ = gain.gain().linear_ramp_to_value_at_time(0.3, start + 0.05);
                        let _ = gain.gain().linear_ramp_to_value_at_time(0.2, start + 0.1);
                        let _ = gain.gain().set_value_at_time(0.2, start + duration - 0.1);
                        let _ = gain.gain().linear_ramp_to_value_at_time(0.0, start + duration);
                        
                        let _ = osc.connect_with_audio_node(&gain);
                        let _ = gain.connect_with_audio_node(master_gain);
                        let _ = osc.start_with_when(start);
                        let _ = osc.stop_with_when(start + duration);
                    }
                 }
                 time_offset += note_data.duration;
            }
            *note_index += 1;
        }
    }



    pub fn stop(&mut self) {
        *self.is_playing.borrow_mut() = false;
        self.interval = None;
        if let Some(gain) = &self.master_gain {
            let _ = gain.disconnect();
        }
        self.audio_context = None;
        self.master_gain = None;
    }

    pub fn is_playing(&self) -> bool {
        *self.is_playing.borrow()
    }
}
