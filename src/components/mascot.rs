use dioxus::prelude::*;

#[derive(PartialEq, Clone, Copy)]
pub enum MascotType {
    Thangamma,
    Kannappan,
}

#[component]
pub fn Mascot(
    mascot_type: MascotType,
    speech_text: Option<String>,
    onclick: EventHandler<()>,
) -> Element {
    let (wrapper_class, svg_class, name, view_box) = match mascot_type {
        MascotType::Thangamma => (
            "mascot-wrapper tapir-wrapper",
            "mascot tapir",
            "Thangamma",
            "0 0 300 400",
        ),
        MascotType::Kannappan => (
            "mascot-wrapper capybara-wrapper",
            "mascot capybara",
            "Kannappan",
            "0 0 300 400",
        ),
    };

    let opacity = if speech_text.is_some() { "1" } else { "0" };
    let message = speech_text.unwrap_or_default();

    rsx! {
        div { class: "{wrapper_class}", onclick: move |_| onclick.call(()),
            svg {
                class: "{svg_class}",
                view_box: "{view_box}",
                "aria-label": "{name}",
                // Speech Bubble
                g { class: "speech-bubble", opacity: "{opacity}",
                    path {
                        d: "M20 40 L280 40 Q320 40 320 80 L320 160 Q320 200 280 200 L20 200 Q-20 200 -20 160 L-20 80 Q-20 40 20 40Z",
                        fill: "white",
                        stroke: "#21618C",
                        stroke_width: "3",
                    }
                    path {
                        d: "M150 200 L130 230 L170 200",
                        fill: "white",
                        stroke: "#21618C",
                        stroke_width: "3",
                    }
                    text {
                        x: "150",
                        y: "120",
                        text_anchor: "middle",
                        class: "speech-text primary-text",
                        fill: "#21618C",
                        font_size: "24",
                        "{message}"
                    }
                }

                if mascot_type == MascotType::Thangamma {
                    ThangammaBody {}
                } else {
                    KannappanBody {}
                }

                text {
                    x: "150",
                    y: "390",
                    text_anchor: "middle",
                    fill: "#21618C",
                    font_family: "Comic Neue",
                    font_size: "32",
                    font_weight: "bold",
                    class: "mascot-name",
                    "{name}"
                }
            }
        }
    }
}

#[component]
fn ThangammaBody() -> Element {
    rsx! {
        // Legs (Back)
        rect { x: "110", y: "330", width: "25", height: "50", rx: "10", fill: "#363636" }
        rect { x: "165", y: "330", width: "25", height: "50", rx: "10", fill: "#363636" }

        // Body (Vertical)
        ellipse { cx: "150", cy: "270", rx: "70", ry: "85", fill: "#4A4A4A" }
        ellipse { cx: "150", cy: "270", rx: "50", ry: "65", fill: "#5A5A5A" } // Lighter belly

        // Mundu (Kasavu)
        path { d: "M80 300 Q150 310 220 300 L220 350 Q150 360 80 350 Z", fill: "#FFF8DC" }
        path { d: "M80 340 Q150 350 220 340 L220 350 Q150 360 80 350 Z", fill: "#FFD700" }

        // Arms
        ellipse { cx: "90", cy: "260", rx: "15", ry: "35", fill: "#363636", transform: "rotate(20 90 260)" }
        ellipse { cx: "210", cy: "260", rx: "15", ry: "35", fill: "#363636", transform: "rotate(-20 210 260)" }

        // Head
        circle { cx: "150", cy: "190", r: "55", fill: "#4A4A4A" }

        // Ears
        ellipse { cx: "100", cy: "160", rx: "12", ry: "18", fill: "#363636", transform: "rotate(-20 100 160)" }
        circle { cx: "100", cy: "150", r: "5", fill: "white" } // White Tip
        ellipse { cx: "200", cy: "160", rx: "12", ry: "18", fill: "#363636", transform: "rotate(20 200 160)" }
        circle { cx: "200", cy: "150", r: "5", fill: "white" } // White Tip

        // Snout/Trunk
        path { d: "M135 210 Q150 280 165 210", fill: "#5A5A5A" }
        ellipse { cx: "150", cy: "245", rx: "15", ry: "10", fill: "#363636" } // Nose tip

        // Eyes - Big and Sparkly
        circle { cx: "130", cy: "190", r: "10", fill: "black" }
        circle { cx: "127", cy: "187", r: "3", fill: "white" }
        circle { cx: "170", cy: "190", r: "10", fill: "black" }
        circle { cx: "167", cy: "187", r: "3", fill: "white" }

        // Blush
        ellipse { cx: "120", cy: "210", rx: "10", ry: "6", fill: "#FFB6C1", opacity: "0.6" }
        ellipse { cx: "180", cy: "210", rx: "10", ry: "6", fill: "#FFB6C1", opacity: "0.6" }
    }
}

#[component]
fn KannappanBody() -> Element {
    rsx! {
        // Body
        ellipse { cx: "150", cy: "280", rx: "75", ry: "60", fill: "#8B4513" }

        // Mundu (Kasavu)
        path { d: "M85 280 Q150 290 215 280 L215 340 Q150 350 85 340 Z", fill: "#FFF8DC" }
        path { d: "M85 330 Q150 340 215 330 L215 340 Q150 350 85 340 Z", fill: "#FFD700" }

        // Legs
        rect { x: "100", y: "340", width: "25", ry: "8", height: "20", fill: "#6B3410" }
        rect { x: "175", y: "340", width: "25", ry: "8", height: "20", fill: "#6B3410" }

        // Head
        circle { cx: "150", cy: "230", r: "53", fill: "#8B4513" }

        // Tilak
        path { d: "M147 190 L153 190 L150 205 Z", fill: "#FF0000" }

        // Mouth
        path { d: "M125 245 Q150 260 175 245", stroke: "#2C1810", stroke_width: "3", fill: "none" }

        // Eyes
        circle { cx: "127", cy: "215", r: "9", fill: "#2C1810" }
        circle { cx: "172", cy: "215", r: "9", fill: "#2C1810" }
        circle { cx: "129", cy: "213", r: "3", fill: "white" }
        circle { cx: "174", cy: "213", r: "3", fill: "white" }

        // Ears
        circle { cx: "112", cy: "190", r: "12", fill: "#6B3410" }
        circle { cx: "187", cy: "190", r: "12", fill: "#6B3410" }
    }
}
