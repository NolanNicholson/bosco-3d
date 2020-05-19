var game_state;

class DisplayScreen {
    constructor(owner) {
        this.owner = owner;
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
            this.owner.advance();
        }
    }

    render() {
    }
}

class LogoDisplay extends DisplayScreen {
    constructor(owner) {
        super(owner);
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

class ControlsDisplay extends DisplayScreen {
    constructor(owner) {
        super(owner);
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

class ScoreTableDisplay extends DisplayScreen {
    constructor(owner) {
        super(owner);
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

class ScoreTable2Display extends DisplayScreen {
    constructor(owner) {
        super(owner);
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

class HighScoreDisplay extends DisplayScreen {
    constructor(owner) {
        super(owner);
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
            while (score.length < 7) score = " " + score;
            text_renderer.render( ranks[i], -10, y, this.cyan);
            text_renderer.render(    score, - 6, y, this.cyan);
            text_renderer.render( names[i],   7, y, this.cyan);
        }
    }
}

class GameOverDisplay extends DisplayScreen {
    constructor(owner) {
        super(owner);
        this.duration = 3;
    }

    render() {
        text_renderer.render("game over", 'center', 0, this.white);
    }
}

class SpaceRecordDisplay extends DisplayScreen {
    constructor(owner) {
        super(owner);
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

class EnterInitialsDisplay extends DisplayScreen {
    constructor(owner) {
        super(owner);
        this.duration = 3;
        this.green = [0, 0xBF/255, 0, 1];

        this.initials_index = 0;
        this.initials = [0, 0, 0];
        this.alphabet = 'abcdefghijklmnopqrstuvwxyz. ';
        this.complete = false;
        this.initials_str = "";
    }

    start() {
        super.start();
        // get the list of things to display from the (old) high scores,
        // with space for this new score spliced in
        this.new_score_index = hi_scores.get_ranking(score);
        this.list_names = [];
        this.list_scores = [];
        for (var i = 0; i < 5; i++) {
            if (i < this.new_score_index) {
                this.list_scores.push(hi_scores.scores[i]);
                this.list_names.push(hi_scores.names[i]);
            } else if (i == this.new_score_index) {
                this.list_scores.push(score);
                this.list_names.push("");
            } else {
                this.list_scores.push(hi_scores.scores[i - 1]);
                this.list_names.push(hi_scores.names[i - 1]);
            }
        }

        console.log(this.list_names, this.list_scores);
    }

    left() {
        this.initials[this.initials_index] += this.alphabet.length - 1;
        this.initials[this.initials_index] %= this.alphabet.length;
    }

    right() {
        this.initials[this.initials_index] += 1;
        this.initials[this.initials_index] %= this.alphabet.length;
    }

    fire() {
        // don't do anything if already complete
        if (this.complete) return;

        this.initials_index++;

        // add the new character to the initials string
        this.initials_str = "";
        for (var i = 0; i < this.initials_index; i++) {
            this.initials_str += this.alphabet[this.initials[i]];
        }

        if (this.initials_index == 3) {
            this.complete = true;
            // back up the index so it's still within array bounds
            this.initials_index = 2;
            //commit this score to the actual high score list
            hi_scores.push(this.initials_str, score);
            this.advance_age = this.age + 2;
        }
    }

    handle_keydown(e) {
        //short-circuit if we're done entering the initials
        if (this.complete) return;

        switch(e.keyCode) {
            case 65: this.left(); break;
            case 68: this.right(); break;
            case 32: this.fire(); break;
        }
    }

    update(dt) {
        // same as the original, but waits for player to enter initials
        this.age += dt;
        player.rotation_matrix = m4.rotate_x(
            player.rotation_matrix, Math.PI * -0.02 * dt);
        player.rotation_matrix = m4.rotate_y(
            player.rotation_matrix, Math.PI * -0.01 * dt);

        if (this.complete && this.age >= this.advance_age) {
            // save our new score record, then return to title
            this.owner.advance();
        }
    }

    render() {
        text_renderer.render("Enter your initials!", 'center', -9, this.red);
        text_renderer.render("Score", -8, -6, this.white);
        text_renderer.render("Name", 3, -6, this.white);
        text_renderer.render("Best 5", 'center', -1, this.red);
        text_renderer.render("Score", -4, 1, this.white);
        text_renderer.render("Name", 5, 1, this.white);

        var score_str = String(score);
        while(score_str.length < 7) score_str = " " + score_str;

        text_renderer.render(score_str, -10, -4, this.white);

        // draw the initials being entered
        for (var i = 0; i < 3; i++) {
            var ch = this.alphabet[this.initials[i]];
            var color = this.white;
            if (!this.complete
                && i == this.initials_index && this.age % 0.5 > 0.25) {
                color = this.red;
            }
            text_renderer.render(ch, 4 + i, -4, color);
        }

        // draw the five ranked scores (including this new score)
        var ranks = ["1st", "2nd", "3rd", "4th", "5th"];

        for (var i = 0; i < 5; i++) {
            var color = (i == this.new_score_index ? this.green : this.cyan);
            var line_score; var line_name;

            line_score = this.list_scores[i];
            line_name = this.list_names[i];

            if (i == this.new_score_index) {
                line_name = this.initials_str;
            }

            line_score = String(line_score);
            while (line_score.length < 7) line_score = " " + line_score;

            var y = 3 + 2 * i;
            text_renderer.render(ranks[i], -9, y, color);
            text_renderer.render(line_score, -6, y, color);
            text_renderer.render(line_name, 6, y, color);
        }
    }
}

//title screen
class TitleSequence {
    constructor() {
        this.screens = [
            new LogoDisplay(this),
            new ControlsDisplay(this),
            new ScoreTableDisplay(this),
            new ScoreTable2Display(this),
            new HighScoreDisplay(this),
        ];
    }

    start() {
        this.age = 0;
        game_state = 'title-screen';
        window.addEventListener("keydown", this.handle_keydown);
        // remove any lingering points from the HUD
        hudpoints.reset_points();

        this.screen_index = 0;
        this.screens[0].start();

        // clear any residual symbols from the HUD
        ctx_hud.clearRect(0, 0, canv_hud.width, canv_hud.height);
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

class GameOverSequence {
    constructor() {
        this.screens = {
            game_over:      new GameOverDisplay(this),
            enter_initials: new EnterInitialsDisplay(this),
            record:         new SpaceRecordDisplay(this),
        };
    }

    handle_keydown(e) {
        title_screen.start();
    }

    start() {
        this.phase = 0;
        if (score > hi_scores.scores[0]) {
            this.screens.record.start();
        } else {
            this.screens.game_over.start();
        }
    }

    advance() {
        this.phase++;
        switch (this.phase) {
            case 1:
                if (score > hi_scores.scores[4]) {
                    this.screens.enter_initials.start();
                    window.addEventListener('keydown', handle_keydown_initials);
                } else {
                    title_screen.start();
                }
                break;
            case 2:
                title_screen.start();
                window.removeEventListener('keydown', handle_keydown_initials);
        }
    }

    end() {
    }
}

function handle_keydown_initials(e) {
    game_over_screen.screens.enter_initials.handle_keydown(e);
}

var title_screen = new TitleSequence();
var game_over_screen = new GameOverSequence();
