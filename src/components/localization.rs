use serde_json::Value;
use wasm_bindgen::prelude::*;
use rand::Rng;

#[wasm_bindgen]
pub struct LocalizationManager {
    translations: Value,
}

impl LocalizationManager {
    pub fn new() -> Self {
        LocalizationManager {
            translations: Value::Null,
        }
    }

    pub fn load_translations(&mut self, json_str: &str) -> Result<(), String> {
        let v: Value = serde_json::from_str(json_str)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;
        self.translations = v;
        Ok(())
    }

    pub fn get_text(&self, path: &str) -> String {
        let parts: Vec<&str> = path.split('.').collect();
        let mut current = &self.translations;

        for part in parts {
            if let Some(val) = current.get(part) {
                current = val;
            } else {
                return format!("Missing: {}", path);
            }
        }

        match current {
            Value::String(s) => s.clone(),
            _ => format!("Invalid type for: {}", path),
        }
    }

    pub fn get_random_phrase(&self, category_path: &str) -> String {
        let parts: Vec<&str> = category_path.split('.').collect();
        let mut current = &self.translations;

        for part in parts {
            if let Some(val) = current.get(part) {
                current = val;
            } else {
                return String::new();
            }
        }

        if let Value::Array(arr) = current {
            if arr.is_empty() {
                return String::new();
            }
            let mut rng = rand::thread_rng();
            let index = rng.gen_range(0..arr.len());
            
            // Handle array of strings or array of arrays of strings (as seen in json)
            match &arr[index] {
                Value::String(s) => s.clone(),
                Value::Array(sub_arr) => {
                     // Pick random from sub-array if it exists
                     if sub_arr.is_empty() {
                         return String::new();
                     }
                     let sub_index = rng.gen_range(0..sub_arr.len());
                     match &sub_arr[sub_index] {
                         Value::String(s) => s.clone(),
                         _ => String::new(),
                     }
                },
                _ => String::new(),
            }
        } else {
            String::new()
        }
    }
}
