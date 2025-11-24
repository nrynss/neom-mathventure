mod components;


use wasm_bindgen::prelude::*;
pub use components::game::NeomMathGame;
pub use components::audio::AudioManager;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    Ok(())
}
