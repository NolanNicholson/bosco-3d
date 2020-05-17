var game_state;

class HighScoreDisplay {
    constructor() {
        this.white = [0.871, 0.871, 0.871, 1];
        this.cyan = [0, 1, 1, 1];
        this.red = [1, 0, 0, 1];
    }

    update(dt) {
        player.rotation_matrix = m4.rotate_x(
            player.rotation_matrix, Math.PI * -0.02 * dt);
        player.rotation_matrix = m4.rotate_y(
            player.rotation_matrix, Math.PI * -0.01 * dt);

        [player.x, player.y, player.z] = m4.apply_transform(
            [0, 10, 55], player.rotation_matrix);
    }

    render() {
        gl.disable(gl.DEPTH_TEST);
        gl.enable(gl.DEPTH_TEST);

        text_renderer.render("The List Of",     'center', - 8, this.white);
        text_renderer.render("Space Fighters.", 'center', - 6, this.white);
        text_renderer.render("Best 5",          'center', - 2, this.red);

        text_renderer.render("Score", -4, 0, this.white);
        text_renderer.render("Name", 6, 0, this.white);

        var ranks = ["1st", "2nd", "3rd", "4th", "5th"];
        var scores = ["20000", "20000", "20000", "20000", "20000"];
        var names = ["N.N", "A.A", "M.M", "C.C", "O.O"];

        for (var i = 0; i < 5; i++) {
            var y = 2 + 2 * i;
            text_renderer.render( ranks[i], -10, y, this.cyan);
            text_renderer.render(scores[i], - 4, y, this.cyan);
            text_renderer.render( names[i],   7, y, this.cyan);
        }
    }
}

//title screen
class TitleScreen {
    constructor() {
        this.age = 0;
    }

    start() {
        game_state = 'title-screen';
        window.addEventListener("keydown", this.handle_keydown);
        this.display_logo();
    }

    display_logo() {
        [player.x, player.y, player.z] = [0, 7, 50];
        var base = new EnemyBase();
        [base.x, base.y, base.z] = [0, 0, 0];
        base.rotation_matrix = m4.rotation_x(Math.PI * 0.5);
        base.scale = 1;
        objects = [
            this,
            obj_starfield,
            base,
            models.logo,
        ];
        models.logo.age = 0;
    }

    display_hiscores() {
        objects = [
            this,
            obj_starfield,
            high_score_display,
        ];
    }

    handle_keydown(e) {
        switch(e.keyCode) {
            case 32: // Spacebar
                title_screen.end();
                break;
        }
    }

    end() {
        window.removeEventListener("keydown", this.handle_keydown);
        game_state = 'main-game';
        load_level();
    }

    update(dt) {
        this.age += dt;
        if (this.age > 20) {
            this.display_logo();
            this.age = 0;
        }
        if (this.age > 15) {
            this.display_hiscores();
        }
    }

    render() {
    }

}

var title_screen = new TitleScreen();
var high_score_display = new HighScoreDisplay();
