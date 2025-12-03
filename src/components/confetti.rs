use web_sys::{window, HtmlElement};
use wasm_bindgen::prelude::*;
use wasm_bindgen::JsCast;
use rand::Rng;

pub struct Confetti;

impl Confetti {
    pub fn fire() {
        let colors = ["#f1c40f", "#e74c3c", "#3498db", "#2ecc71", "#9b59b6"];
        let mut rng = rand::thread_rng();

        if let Some(doc) = window().and_then(|w| w.document()) {
            if let Some(body) = doc.body() {
                for _ in 0..50 {
                    if let Ok(particle) = doc.create_element("div") {
                        if let Ok(particle_el) = particle.dyn_into::<HtmlElement>() {
                            let size = rng.gen_range(5.0..15.0);
                            let color = colors[rng.gen_range(0..colors.len())];
                            let left = rng.gen_range(0.0..100.0);
                            let duration = rng.gen_range(1.0..3.0);
                            let _delay = rng.gen_range(0.0..0.5);

                            let style = particle_el.style();
                            let _ = style.set_property("width", &format!("{}px", size));
                            let _ = style.set_property("height", &format!("{}px", size));
                            let _ = style.set_property("background-color", color);
                            let _ = style.set_property("position", "fixed");
                            let _ = style.set_property("top", "-10px");
                            let _ = style.set_property("left", &format!("{}vw", left));
                            let _ = style.set_property("border-radius", "50%");
                            let _ = style.set_property("pointer-events", "none");
                            let _ = style.set_property("z-index", "9999");
                            let _ = style.set_property("transition", &format!("top {}s ease-in, transform {}s linear, opacity {}s ease-in", duration, duration, duration));
                            
                            let _ = body.append_child(&particle_el);

                            // Trigger animation
                            let p_clone = particle_el.clone();
                            let _ = window().unwrap().request_animation_frame(Closure::once_into_js(move || {
                                let style = p_clone.style();
                                let _ = style.set_property("top", "110vh");
                                let _ = style.set_property("transform", &format!("rotate({}deg) translateX({}px)", rand::thread_rng().gen_range(0.0..360.0), rand::thread_rng().gen_range(-50.0..50.0)));
                                let _ = style.set_property("opacity", "0");
                            }).as_ref().unchecked_ref());

                            // Cleanup
                            let p_cleanup = particle_el.clone();
                            let timeout_ms = ((duration * 1000.0) + 100.0) as i32;
                            let _ = gloo_timers::callback::Timeout::new(timeout_ms as u32, move || {
                                let _ = p_cleanup.remove();
                            }).forget();
                        }
                    }
                }
            }
        }
    }
}
