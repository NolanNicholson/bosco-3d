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
        models.logo,
    ];
    game_state = 'title-screen';
    window.addEventListener("keydown", handle_keydown_title_screen);

    gl.enable(gl.STENCIL_TEST);
}

function end_title_screen() {
    gl.disable(gl.STENCIL_TEST);
    window.removeEventListener("keydown", handle_keydown_title_screen);
    game_state = 'main-game';
    load_level();
}
