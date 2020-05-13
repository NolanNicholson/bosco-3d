class RandomEnemySpawner {
    constructor() {
        this.timer = 0;
        this.num_enemies = 0;
        this.spawn_interval = 4;
        this.max_num_enemies = 4;
        this.formation_active = false;
        this.condition_red = false;
    }

    spy_intel() {
        this.start_condition_red();
    }

    start_condition_red() {
        this.condition_red = true;
        this.quiet_player_sound();
        this.spawn_interval = 0.5;
        this.max_num_enemies = 9;
        sounds.con_red_loop.play(true);

        sounds.con_red_voice.play(true);
    }

    end_condition_red() {
        sounds.con_red_loop.stop();
        sounds.con_red_voice.stop();
        this.condition_red = false;
        this.spawn_interval = 4;
        this.max_num_enemies = 4;
    }

    position_enemy_around_player(new_enemy, spawn_z, spawn_radius) {
        var new_location_matrix = m4.translation(
            player.ship_obj.x, player.ship_obj.y, player.ship_obj.z);

        var spawn_angle = Math.random() * 2 * Math.PI;
        new_location_matrix = m4.multiply(new_location_matrix,
            player.rotation_matrix);
        new_location_matrix = m4.translate(new_location_matrix,
            spawn_radius * Math.cos(spawn_angle),
            spawn_radius * Math.sin(spawn_angle), spawn_z);

        new_enemy.x = new_location_matrix[12];
        new_enemy.y = new_location_matrix[13];
        new_enemy.z = new_location_matrix[14];

        return spawn_angle;
    }

    spawn_spy() {
        var spy = new Enemy('spy');
        spy.ai_mode = 'spy';
        sounds.spy_ship_sighted.play();

        var spawn_angle = this.position_enemy_around_player(spy, -30, 35);

        //TODO: shouldn't need a full mmult here
        var rel_to_player = spy.get_rel_to_player();
        var up = m4.translate(player.rotation_matrix, 0, 1, 0).slice(12, 15);
        spy.rotation_matrix = m4.lookAt(
            [0, 0, 0],
            rel_to_player,
            up,
        );
        spy.rotation_matrix = m4.rotate_x(spy.rotation_matrix,
            Math.PI / 2);
        spy.rotation_matrix = m4.rotate_y(spy.rotation_matrix,
            spawn_angle + Math.PI / 2);
        spy.maneuver_age = 0;
        spy.drive_speed = 18;

        objects.push(spy);
        this.new_enemy = spy;
        this.num_enemies++;
    }
    
    spawn_enemy() {
        //randomly spawn either a P or I-type
        var new_type = (Math.random() > 0.5 ? 'p' : 'i');
        var new_enemy = new Enemy(new_type);

        var dodge = Math.random() > 0.5;
        var spawn_radius; var spawn_z;

        if (dodge) {
            new_enemy.ai_mode = 'dodge-me';
            var spawn_z = -90;
            var spawn_radius = 30;
        } else {
            var spawn_z = -10;
            var spawn_radius = 20;
        }

        this.position_enemy_around_player(new_enemy, spawn_z, spawn_radius);

        objects.push(new_enemy);
        this.new_enemy = new_enemy;

        if (!this.num_enemies && !this.condition_red) {
            sounds.alert_alert.play();
            this.quiet_player_sound();
            sounds.enemy_drive_loop.play(true);
        }

        this.num_enemies++;
    }

    quiet_player_sound() {
        sounds.player_drive_start.stop();
        sounds.player_drive_loop.stop();
        if (sounds.player_drive_start.source &&
            sounds.player_drive_start.source.onended) {
            sounds.player_drive_start.source.onended = null;
        }

    }

    lose_enemy() {
        this.num_enemies--;
        console.log("lost enemy (", this.num_enemies, ")");
        if (!this.num_enemies 
            && !this.condition_red && player.state == 'driving') {
            sounds.enemy_drive_loop.stop();
            sounds.player_drive_loop.play(true);
        }
    }

    spawn_formation() {
        var unexploded_bases = [];
        bases.forEach(base => {
            if (!base.explosions) {
                unexploded_bases.push(base);
            }
        })
        // don't spawn a formation if there aren't any bases
        if (!unexploded_bases.length) {
            return;
        }

        sounds.battle_stations.play();
        sounds.formation_loop.play(true);
        this.quiet_player_sound();

        var f_base = unexploded_bases[
            Math.floor(Math.random() * unexploded_bases.length)];

        this.formation = new Formation(f_base.x, f_base.y, f_base.z);
        this.formation_active = true;
    }

    end_formation() {
        this.formation_active = false;
        sounds.formation_loop.stop();
        if (player.state == 'driving') {
            sounds.player_drive_loop.play(true);
        }
    }

    get_active_pan() {
        var panner;
        if (this.formation_active)
            panner = this.formation.leader;
        else {
            if (!this.new_enemy) return 0;
            else panner = this.new_enemy;
        }

        var relative_enemy_position = [
            panner.x - player.ship_obj.x,
            panner.y - player.ship_obj.y,
            panner.z - player.ship_obj.z
        ];

        // rotate the relative enemy position to the player's field of view
        var mat = m4.translate(m4.inverse(player.rotation_matrix),
            ...relative_enemy_position);

        var x = mat[12]; var z = mat[14];
        return (x / Math.sqrt(x*x + z*z));

    }

    update(dt) {
        var pan = this.get_active_pan();
        if (this.formation_active) {
            sounds.formation_loop.pan(pan);
        } else {
            sounds.enemy_drive_loop.pan(pan);
        }

        //don't spawn, or update spawn timer, unless the player is driving
        //and we have less than the maximum number of enemies
        if (player.state != 'driving' ||
            this.num_enemies >= this.max_num_enemies ||
            this.formation_active) {
            return;
        }

        this.timer += dt;
        if (this.timer >= this.spawn_interval) {
            this.spawn_enemy();
            console.log("spawned enemy (", this.num_enemies, ")");
            this.timer = 0;
        }
    }
}
