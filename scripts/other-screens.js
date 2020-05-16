//title screen
var game_state;

function handle_keydown_title_screen(e) {
    switch(e.keyCode) {
        case 32: // Spacebar
            end_title_screen();
            break;
    }
}

function start_title_screen() {
    objects = [
        obj_starfield,
    ];
    game_state = 'title-screen';
    window.addEventListener("keydown", handle_keydown_title_screen);
}

function end_title_screen() {
    window.removeEventListener("keydown", handle_keydown_title_screen);
    game_state = 'main-game';
    load_level();
}
