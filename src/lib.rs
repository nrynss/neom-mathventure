mod components;

use wasm_bindgen::prelude::*;
pub use components::game::NeomMathGame;

#[wasm_bindgen(start)]
pub fn main() -> Result<(), JsValue> {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    Ok(())
}