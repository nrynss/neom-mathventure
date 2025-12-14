mod components;

use wasm_bindgen::prelude::*;
use dioxus::prelude::*;
use components::game::NeomMathGame;
use components::ui::{WelcomeScreen, GameScreen, GameOverScreen, LanguageSwitcher};
use components::mascot::{Mascot, MascotType};


#[wasm_bindgen(start)]
pub fn start() {
    #[cfg(debug_assertions)]
    console_error_panic_hook::set_once();
    
    dioxus::launch(App);
}

#[derive(Clone, PartialEq)]
enum GameState {
    Welcome,
    Playing,
    GameOver,
}

fn App() -> Element {
    let mut game = use_signal(|| NeomMathGame::new());
    let mut game_state = use_signal(|| GameState::Welcome);
    let mut mascot_speech = use_signal(|| (MascotType::Thangamma, None::<String>));
    let mut mascot_turn = use_signal(|| MascotType::Thangamma);

    // Game Loop
    use_future(move || async move {
        loop {
            if game_state() == GameState::Playing {
                let mut current_game = game.write();
                let running = current_game.tick();
                if !running {
                    game_state.set(GameState::GameOver);
                    current_game.stop_music();
                }
            }
            gloo_timers::future::TimeoutFuture::new(1000).await;
        }
    });

    // Initial Locale Load
    use_effect(move || {
        spawn(async move {
            if let Ok(response) = gloo_net::http::Request::get("locales/english.json").send().await {
                if let Ok(text) = response.text().await {
                    game.write().load_locales(&text);
                }
            }
        });
    });

    rsx! {
        div { class: "game-container",
            LanguageSwitcher {
                onchange: move |lang: String| {
                    spawn(async move {
                        if let Ok(response) = gloo_net::http::Request::get(&format!("locales/{}.json", lang)).send().await {
                            if let Ok(text) = response.text().await {
                                game.write().load_locales(&text);
                            }
                        }
                    });
                },
                on_audio_toggle: move |_| {
                    game.write().toggle_audio();
                },
                on_music_toggle: move |_| {
                    let mut g = game.write();
                    if g.is_music_playing() {
                        g.stop_music();
                    } else {
                        g.start_music();
                    }
                }
            }

            div { class: "game-card",
                div { class: "mascots-container",
                    Mascot {
                        mascot_type: MascotType::Thangamma,
                        speech_text: if mascot_speech().0 == MascotType::Thangamma { mascot_speech().1 } else { None },
                        onclick: move |_| {
                            let text = game.read().get_mascot_message("thangamma", "greetings");
                            if !text.is_empty() {
                                mascot_speech.set((MascotType::Thangamma, Some(text.clone())));
                                game.write().speak_mascot_message(&text, "thangamma");
                                // Clear after 3s
                                spawn(async move {
                                    gloo_timers::future::TimeoutFuture::new(3000).await;
                                    mascot_speech.set((MascotType::Thangamma, None));
                                });
                            }
                        }
                    }
                    Mascot {
                        mascot_type: MascotType::Kannappan,
                        speech_text: if mascot_speech().0 == MascotType::Kannappan { mascot_speech().1 } else { None },
                        onclick: move |_| {
                            let text = game.read().get_mascot_message("kannappan", "motivation"); // Using motivation as greeting for now or add greeting to json
                            if !text.is_empty() {
                                mascot_speech.set((MascotType::Kannappan, Some(text.clone())));
                                game.write().speak_mascot_message(&text, "kannappan");
                                spawn(async move {
                                    gloo_timers::future::TimeoutFuture::new(3000).await;
                                    mascot_speech.set((MascotType::Kannappan, None));
                                });
                            }
                        }
                    }
                }

                match game_state() {
                    GameState::Welcome => rsx! {
                        WelcomeScreen {
                            game: game,
                            onstart: move |_| {
                                game.write().reset_game();
                                game.write().generate_question();
                                game_state.set(GameState::Playing);
                                game.write().start_music();
                            }
                        }
                    },
                    GameState::Playing => rsx! {
                        GameScreen {
                            game: game,
                            oncheck: move |answer: String| {
                                if let Ok(val) = answer.parse::<i32>() {
                                    let correct = game.write().check_answer(val);
                                    if correct {
                                        game.write().generate_question();
                                        
                                        let speaker = mascot_turn();
                                        mascot_turn.set(if speaker == MascotType::Thangamma { MascotType::Kannappan } else { MascotType::Thangamma });

                                        let (text, mascot_name) = match speaker {
                                            MascotType::Thangamma => (
                                                game.read().get_mascot_message("thangamma", "encouragement"),
                                                "thangamma"
                                            ),
                                            MascotType::Kannappan => (
                                                game.read().get_mascot_message("kannappan", "celebrations"),
                                                "kannappan"
                                            ),
                                        };

                                        if !text.is_empty() {
                                            mascot_speech.set((speaker, Some(text.clone())));
                                            game.write().speak_mascot_message(&text, mascot_name);
                                        }
                                    } else {
                                        let text = game.read().get_mascot_message("kannappan", "motivation");
                                        if !text.is_empty() {
                                            mascot_speech.set((MascotType::Kannappan, Some(text.clone())));
                                            game.write().speak_mascot_message(&text, "kannappan");
                                        }
                                    }
                                    spawn(async move {
                                        gloo_timers::future::TimeoutFuture::new(2000).await;
                                        // Clear speech
                                        // Note: this logic is simple, might overwrite other speech
                                    });
                                }
                            },
                            onrestart: move |_| {
                                game.write().reset_game();
                                game.write().generate_question();
                            }
                        }
                    },
                    GameState::GameOver => rsx! {
                        GameOverScreen {
                            game: game,
                            score: game.read().get_score(),
                            accuracy: game.read().get_accuracy(),
                            onrestart: move |_| {
                                game.write().reset_game();
                                game.write().generate_question();
                                game_state.set(GameState::Playing);
                            }
                        }
                    },
                }
            }
        }
    }
}
