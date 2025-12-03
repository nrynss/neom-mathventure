use dioxus::prelude::*;
use crate::components::game::NeomMathGame;

#[component]
#[component]
pub fn WelcomeScreen(game: Signal<NeomMathGame>, onstart: EventHandler<()>) -> Element {
    let current_game = game.read();
    rsx! {
        div { class: "screen active", id: "welcome-screen",
            h1 { class: "game-title", "{current_game.get_ui_text(\"ui.title\")}" }
            div { class: "content-box",
                p { class: "intro-text", "{current_game.get_ui_text(\"ui.welcomeMessage\")}" }
                p { class: "intro-subtext", "{current_game.get_ui_text(\"ui.welcomeIntro\")}" }
                button {
                    class: "primary-button",
                    onclick: move |_| onstart.call(()),
                    "{current_game.get_ui_text(\"ui.buttons.start\")}"
                }
            }
        }
    }
}

#[component]
pub fn GameScreen(
    game: Signal<NeomMathGame>,
    oncheck: EventHandler<String>,
    onrestart: EventHandler<()>,
) -> Element {
    let current_game = game.read();
    let time_left = current_game.get_time_left();
    let score = current_game.get_score();
    let high_score = current_game.get_high_score();
    let level = current_game.get_difficulty();
    let question = current_game.current_question_text();

    let mut answer = use_signal(|| String::new());

    rsx! {
        div { class: "screen active", id: "game-screen",
            div { class: "stats-bar",
                div { class: "stat-item",
                    span { class: "label", "{current_game.get_ui_text(\"ui.timer\")}:" }
                    " "
                    span { id: "time-display", "{time_left}" }
                    "s"
                }
                div { class: "stat-item",
                    span { class: "label", "{current_game.get_ui_text(\"ui.score\")}:" }
                    " "
                    span { id: "score-display", "{score}" }
                }
                div { class: "stat-item",
                    span { class: "label", "{current_game.get_ui_text(\"ui.highScore\")}:" }
                    " "
                    span { id: "highscore-display", "{high_score}" }
                }
            }

            div { class: "game-area",
                div { class: "level-display", "{current_game.get_ui_text(\"ui.level\")} {level}" }
                div { id: "question-display", class: "question", "{question} = ?" }

                div { class: "input-area",
                    input {
                        r#type: "number",
                        id: "answer-input",
                        placeholder: "?",
                        autocomplete: "off",
                        value: "{answer}",
                        oninput: move |evt| answer.set(evt.value()),
                        onkeypress: move |evt| {
                            if evt.key() == Key::Enter {
                                oncheck.call(answer());
                                answer.set(String::new());
                            }
                        }
                    }
                    // Mic button placeholder - implementation requires more JS interop
                    button { class: "icon-button", title: "Speak Answer", "🎤" }
                    button {
                        id: "check-btn",
                        class: "primary-button",
                        onclick: move |_| {
                            oncheck.call(answer());
                            answer.set(String::new());
                        },
                        "{current_game.get_ui_text(\"ui.buttons.check\")}"
                    }
                }

                div { id: "feedback-message", class: "message" }
            }
        }
    }
}

#[component]
pub fn GameOverScreen(
    game: Signal<NeomMathGame>,
    score: i32,
    accuracy: i32,
    onrestart: EventHandler<()>,
) -> Element {
    use_effect(move || {
        crate::components::confetti::Confetti::fire();
    });

    let current_game = game.read();

    rsx! {
        div { class: "screen active", id: "game-over-screen",
            h2 { class: "game-title", "{current_game.get_ui_text(\"ui.gameOver\")}" }
            div { class: "content-box",
                p { "{current_game.get_ui_text(\"ui.finalScore\")}: ", span { id: "final-score", "{score}" } }
                p { "{current_game.get_ui_text(\"ui.finalAccuracy\")}: ", span { id: "final-accuracy", "{accuracy}" } "%" }
                button {
                    id: "restart-btn",
                    class: "primary-button",
                    onclick: move |_| onrestart.call(()),
                    "{current_game.get_ui_text(\"ui.buttons.playAgain\")}"
                }
            }
        }
    }
}

#[component]
pub fn LanguageSwitcher(
    onchange: EventHandler<String>,
    on_audio_toggle: EventHandler<()>,
    on_music_toggle: EventHandler<()>,
) -> Element {
    rsx! {
        div { class: "language-switcher", "aria-label": "Language Selection",
            button { class: "lang-btn", onclick: move |_| onchange.call("malayalam".to_string()), "മലയാളം" }
            button { class: "lang-btn", onclick: move |_| onchange.call("manglish".to_string()), "Manglish" }
            button { class: "lang-btn", onclick: move |_| onchange.call("english".to_string()), "English" }
            button {
                id: "audio-toggle",
                class: "lang-btn",
                "aria-label": "Toggle Audio",
                onclick: move |_| on_audio_toggle.call(()),
                "🔊"
            }
            button {
                id: "music-toggle",
                class: "lang-btn",
                "aria-label": "Toggle Music",
                onclick: move |_| on_music_toggle.call(()),
                "🎵"
            }
        }
    }
}
