var game_state;

class TitleDisplay {
    constructor() {
        this.white = [0.871, 0.871, 0.871, 1];
        this.cyan = [0, 1, 1, 1];
        this.red = [1, 0, 0, 1];
        this.duration = 1;
    }

    start() {
        this.age = 0;
        objects = [
            this,
            obj_starfield,
        ];
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

        if (this.age >= this.duration) {
            title_screen.advance();
        }
    }

    render() {
    }
}

class LogoDisplay extends TitleDisplay {
    constructor() {
        super();
        this.duration = 15;
    }

    start() {
        super.start();
        [player.x, player.y, player.z] = [0, 7, 50];
        var base = new EnemyBase();
        [base.x, base.y, base.z] = [0, 0, 0];
        base.rotation_matrix = m4.rotation_x(Math.PI * 0.5);
        base.scale = 1;
        objects.push(base);
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
        this.duration = 10;
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

class ScoreTableObj extends Explodable{
    constructor(model, texture, display_xyz, explode_time, txt1, txt2) {
        super(model, texture);
        this.worth = 0;
        this.white = [0.871, 0.871, 0.871, 1];
        [this.x, this.y, this.z] = [NaN, NaN, NaN];
        this.display_xyz = display_xyz;

        // parameters for reappearing with text after exploding
        this.age = 0;
        this.reborn = false;
        this.explode_time = explode_time;
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

            var xyz = this.display_xyz;
            xyz = m4.apply_transform(xyz, player.rotation_matrix);
            [this.x, this.y, this.z] = xyz;
        }
    }

    render() {
        if (this.exploded && 
            this.age >= this.explode_time + this.explosion.max_age)
            return;
        super.render();

        if (this.reborn) {
            var text_x = this.display_xyz[0] - 4;
            var text_y = -this.display_xyz[1];
            text_renderer.render(this.txt1, text_x, text_y, this.white);
            text_renderer.render(this.txt2, text_x + 1, text_y + 2, this.white);
        }
    }
}

class ScoreTableTemplateObj extends ScoreTableObj {
    constructor(template, display_xyz, explode_time, txt1, txt2) {
        super(template.model_asset, template.texture_asset,
            display_xyz, explode_time, txt1, txt2);
        this.explode_sound = template.explode_sound;
        this.explosion_properties = template.explosion_properties;
    }
}

class ScoreTableEnemy extends ScoreTableTemplateObj {
    constructor(enemy_type, display_xyz, explode_time, txt1, txt2) {
        var template = new Enemy(enemy_type);
        super(template, display_xyz, explode_time, txt1, txt2);
    }
}

class ScoreTableAsteroid extends ScoreTableTemplateObj {
    constructor(display_xyz, explode_time, txt1, txt2) {
        var template = new Asteroid();
        super(template, display_xyz, explode_time, txt1, txt2);
    }
}

class ScoreTableCosmoMine extends ScoreTableTemplateObj {
    constructor(display_xyz, explode_time, txt1, txt2) {
        var template = new CosmoMine();
        super(template, display_xyz, explode_time, txt1, txt2);
    }
}

class ScoreTableDisplay extends TitleDisplay {
    constructor() {
        super();
        this.duration = 15;
    }

    start() {
        super.start();
        var x = 10;
        var z = -6;
        this.enemies = [
            new ScoreTableAsteroid(    [- x,  0, z],  3, "Asteroid", "10 pts"),
            new ScoreTableCosmoMine(   [  0,  0, z],  5, "Cosmo-Mine", "20 pts"),
            new ScoreTableEnemy(  'i', [  x,  0, z],  7, " I-Type", "50 pts"),
            new ScoreTableEnemy(  'p', [  x, -8, z],  9, " P-Type", "60 pts"),
            new ScoreTableEnemy(  'e', [  0, -8, z], 11, " E-Type", "70 pts"),
            new ScoreTableEnemy('spy', [- x, -8, z], 13, " Spy Ship", "Mystery"),
        ]
        objects.push(...this.enemies);
        all_colliders = [];
    }

    update(dt) {
        super.update(dt);
        [player.x, player.y, player.z] = [0, 0, 0];
    }

    render() {
        this.display_typed_header("Score Table");
    }
}

class DemoBase extends EnemyBase {
    report_self_destroyed() {
        // don't report demo base's destruction to the spawner,
        // or it will try to advance the level
    }
}

class ScoreTable2Display extends TitleDisplay {
    constructor() {
        super();
        this.duration = 10;
    }

    start() {
        super.start();

        // this screen shows an enemy base
        this.base = new DemoBase();
        [this.base.x, this.base.y, this.base.z] = [0, 0, 0];
        this.base.rotation_matrix = m4.rotate_x(
            player.rotation_matrix, Math.PI * 0.25);
        this.base.scale = 3;
        objects.push(this.base);

        this.phase = 0;
    }

    update(dt) {
        super.update(dt);
        [player.x, player.y, player.z] = m4.apply_transform(
            [0, 10, 55], player.rotation_matrix);

        if (this.phase == 0 && this.age > 2) {
            this.phase++;
            this.base.balls[0].explode();
        }
        else if (this.phase == 1 && this.age > 5) {
            this.phase++;
            this.base.explode();
        }
    }

    render() {
        text_renderer.render('Score Table', 'center', -8, this.cyan);

        if (this.age > 6) {
            text_renderer.render('Enemy Base', 'center', 8, this.white);
            text_renderer.render('1500 pts', 'center', 10, this.white);
        }
        else if (this.age > 3) {
            text_renderer.render('Cannon', 'center', 8, this.white);
            text_renderer.render('200 pts', 'center', 10, this.white);
        }
    }
}

class HighScoreDisplay extends TitleDisplay {
    constructor() {
        super();
        this.duration = 5;
    }

    start() {
        super.start();
    }

    render() {
        text_renderer.render("The List Of",     'center', - 8, this.white);
        text_renderer.render("Space Fighters.", 'center', - 6, this.white);
        text_renderer.render("Best 5",          'center', - 2, this.red);

        text_renderer.render("Score", -4, 0, this.white);
        text_renderer.render("Name", 6, 0, this.white);

        var ranks = ["1st", "2nd", "3rd", "4th", "5th"];
        var scores = hi_scores.scores;
        var names = hi_scores.names;

        for (var i = 0; i < 5; i++) {
            var y = 2 + 2 * i;
            var score = String(scores[i]);
            text_renderer.render( ranks[i], -10, y, this.cyan);
            text_renderer.render(    score, - 4, y, this.cyan);
            text_renderer.render( names[i],   7, y, this.cyan);
        }
    }
}

class GameOverDisplay extends TitleDisplay {
    constructor() {
        super();
        this.duration = 3;
    }

    render() {
        text_renderer.render("game over", 'center', 0, this.white);
    }
}

class SpaceRecordDisplay extends TitleDisplay {
    constructor() {
        super();
        this.duration = 6;
        this.orange = [255, 0x66/255, 0, 1];
        this.blue = [0, 0x66/255, 0xdc/255, 1];
    }

    start() {
        super.start();
        sounds.high_score.play();
    }

    render() {
        text_renderer.render("CONGRATULATIONS!!", 'center', -9, this.red);
        text_renderer.render("the high score", 'center', -5, this.orange);
        text_renderer.render("of the day", 'center', -3, this.orange);
        text_renderer.render("go for the", 'center', 6, this.blue);
        text_renderer.render("space record now", 'center', 8, this.blue);

        if (this.age % 0.6 > 0.3) {
            var scale = 4;
            text_renderer.custom_scale = m4.scaling(scale, scale, scale);
            text_renderer.render(String(score), 'center', 0.75, this.white);
            text_renderer.custom_scale = m4.identity();
        }
    }
}

//title screen
class TitleScreen {
    constructor() {
        this.screens = [
            new LogoDisplay(),
            new ControlsDisplay(),
            new ScoreTableDisplay(),
            new ScoreTable2Display(),
            new HighScoreDisplay(),
        ];
    }

    start() {
        this.age = 0;
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
                title_screen.start_game();
                break;
        }
    }

    start_game() {
        window.removeEventListener("keydown", this.handle_keydown);
        game_state = 'main-game';
        score = 0;
        lives = 3;
        load_level();
    }
}

var title_screen = new TitleScreen();
