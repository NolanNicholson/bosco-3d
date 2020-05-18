var game_state;

class TitleDisplay {
    constructor() {
        this.white = [0.871, 0.871, 0.871, 1];
        this.cyan = [0, 1, 1, 1];
        this.red = [1, 0, 0, 1];
        this.max_age = 1;
    }

    start() {
        this.age = 0;
    }

    display_typed_header(txt) {
        var txt_i = Math.min(txt.length, Math.floor(this.age * 6));
        txt = txt.substr(0, txt_i) + ' '.repeat(txt.length - txt_i);
        text_renderer.render(txt, 'center', -8, this.cyan);
    }

    display_timed_line(txt, y, time) {
        if (this.age >= time) {
            text_renderer.render(txt, 'center', y, this.white);
        }
    }

    update(dt) {
        this.age += dt;
        player.rotation_matrix = m4.rotate_x(
            player.rotation_matrix, Math.PI * -0.02 * dt);
        player.rotation_matrix = m4.rotate_y(
            player.rotation_matrix, Math.PI * -0.01 * dt);

        if (this.age >= this.max_age) {
            title_screen.advance();
        }
    }

    render() {
    }
}

class LogoDisplay extends TitleDisplay {
    constructor() {
        super();
        this.max_age = 15;
    }

    start() {
        super.start();
        [player.x, player.y, player.z] = [0, 7, 50];
        var base = new EnemyBase();
        [base.x, base.y, base.z] = [0, 0, 0];
        base.rotation_matrix = m4.rotation_x(Math.PI * 0.5);
        base.scale = 1;
        objects = [
            this,
            obj_starfield,
            base,
        ];
        models.logo.age = 0;
    }

    update(dt) {
        super.update(dt);
        // move the player so that the base in the logo doesn't appear to move
        [player.x, player.y, player.z] = m4.apply_transform(
            [0, 10, 55], player.rotation_matrix);
    }

    render() {
        models.logo.render(this.age);

        // Draw NAMCO + Nolan authorship text
        if (this.age > 3) {
            gl.disable(gl.DEPTH_TEST);
            var white = [0.871, 0.871, 0.871, 1];
            var logo_ty = -models.logo.logo_y * text_renderer.vh_char;

            var t_y = Math.floor(text_renderer.vh_char * 0.7) + logo_ty;
            text_renderer.render(
                "Original © 1981 Namco",   'center', t_y, white);
            text_renderer.render(
                "3D Version By N.Nicholson", 'center', t_y+2, white);

            //render "STAR DESTROYER" after a certain time
            if (this.age > 9.5) {
                var t_y = Math.floor(text_renderer.vh_char * -0.5) + logo_ty;
                text_renderer.render(
                    "Star Destroyer", 'center', t_y, white);
            }

            gl.enable(gl.DEPTH_TEST);
        }
    }
}

class ControlsDisplay extends TitleDisplay {
    constructor() {
        super();
        this.max_age = 10;
    }

    start() {
        super.start();
        objects = [
            this,
            obj_starfield,
        ];
    }

    render() {
        this.display_typed_header("Controls");
        this.display_timed_line("W.A.S.D.        Move", 0, 3);
        this.display_timed_line("Space Bar       Fire", 2, 4);
        this.display_timed_line("P              Pause", 4, 5);

        this.display_timed_line("Press Space Bar to Start", 8, 7);
    }
}

class ScoreTableEnemy extends Enemy {
    constructor(enemy_type, display_xyz, explode_time, txt1, txt2) {
        super(enemy_type);
        this.drive_speed = 0;
        this.display_xyz = display_xyz;
        this.age = 0;
        this.explode_time = explode_time;
        this.worth = 0;
        this.reborn = false;
        this.white = [0.871, 0.871, 0.871, 1];
        this.txt1 = txt1; this.txt2 = txt2;
    }

    remove() {
    }

    update(dt) {
        super.update(dt);
        this.age += dt;

        if (this.age >= this.explode_time && !this.exploded && !this.reborn) {
            this.explode();
        }
        if (this.age >= this.explode_time + 0.75 && !this.reborn) {
            this.exploded = false;
            this.reborn = true;
        }

        if (!this.exploded) {
            var spin = (this.age / 3) % 2;

            // rotation matrix is relative to the player's
            this.rotation_matrix = m4.rotate_y(
                player.rotation_matrix, Math.PI * spin);
            this.rotation_matrix = m4.rotate_x(
                this.rotation_matrix, -Math.PI * 0.1);

            // position is backed out from screen space
            var z = 0.99;
            var d_xyz = [
                this.display_xyz[0], this.display_xyz[1], z
            ];
            //d_xyz = [10, 10, 0.9];
            var xyz = m4.identity();
            if (viewproj) {
                xyz = m4.multiply(xyz, m4.inverse(viewproj));
            }
            xyz = m4.translate(xyz, ...d_xyz);
            xyz = xyz.slice(12, 15);

            [this.x, this.y, this.z] = xyz;
        }
    }

    render() {
        if (this.exploded && 
            this.age >= this.explode_time + this.explosion.max_age)
            return;
        super.render();

        if (this.reborn) {
            var text_x = this.display_xyz[0] - 3;
            var text_y = -this.display_xyz[1];
            text_renderer.render(this.txt1, text_x, text_y, this.white);
            text_renderer.render(this.txt2, text_x, text_y + 2, this.white);
        }
    }
}

class ScoreTableDisplay extends TitleDisplay {
    constructor() {
        super();
        this.max_age = 15;
    }

    start() {
        super.start();
        this.enemies = [
            new ScoreTableEnemy(  'i', [- 8,  0, -8], 3, "I-Type", "50 pts"),
            new ScoreTableEnemy(  'p', [  0,  0, -8], 5, "P-Type", "60 pts"),
            new ScoreTableEnemy(  'e', [  8,  0, -8], 7, "E-Type", "70 pts"),
            new ScoreTableEnemy('spy', [  0, -8, -8], 9, "Spy Ship", "Mystery"),
        ]
        objects = [
            this,
            obj_starfield,
            ...this.enemies,
        ];
        all_colliders = [];
    }

    render() {
        this.display_typed_header("Score Table");
    }
}

class HighScoreDisplay extends TitleDisplay {
    constructor() {
        super();
        this.max_age = 5;
    }

    start() {
        super.start();
        objects = [
            this,
            obj_starfield,
        ];
    }

    render() {
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
        this.screens = [
            //new LogoDisplay(),
            //new ControlsDisplay(),
            new ScoreTableDisplay(),
            //new HighScoreDisplay(),
        ];
    }

    start() {
        game_state = 'title-screen';
        window.addEventListener("keydown", this.handle_keydown);

        this.screen_index = 0;
        this.screens[0].start();
    }

    advance() {
        this.screen_index = (this.screen_index + 1) % this.screens.length;
        this.screens[this.screen_index].start();
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
}

var title_screen = new TitleScreen();
