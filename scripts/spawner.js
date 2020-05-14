class SoundManager {
    quiet_player_sound() {
        sounds.player_drive_start.stop();
        sounds.player_drive_loop.stop();
        if (sounds.player_drive_start.source &&
            sounds.player_drive_start.source.onended) {
            sounds.player_drive_start.source.onended = null;
        }
    }

    start_condition_red() {
        if (player.state == 'driving') {
            spawner.sound_manager.quiet_player_sound();
        }
        sounds.con_red_loop.play(true);
        sounds.con_red_voice.play(true);
    }

    end_condition_red() {
        sounds.con_red_loop.stop();
        sounds.con_red_voice.stop();
    }

    update_pan() {
        var panner;
        if (spawner.formation_active)
            panner = spawner.formation.leader;
        else {
            if (!spawner.new_enemy) return 0;
            else panner = spawner.new_enemy;
        }

        var relative_enemy_position = panner.get_rel_to_player();

        // rotate the relative enemy position to the player's field of view
        var sound_xyz = m4.apply_transform(relative_enemy_position,
            m4.inverse(player.rotation_matrix));

        var x = sound_xyz[0]; var z = sound_xyz[2];
        var pan = (x / Math.sqrt(x*x + z*z));

        if (this.formation_active) {
            sounds.formation_loop.pan(pan);
        } else {
            sounds.enemy_drive_loop.pan(pan);
        }
    }
}


class RandomEnemySpawner {
    constructor() {
        this.sound_manager = new SoundManager();
        this.reset_level();
    }

    reset_level() {
        this.timer = 0;
        this.num_enemies = 0;
        this.max_num_enemies = 4;
        this.condition = 'green';
        this.formation_active = false;
        this.num_yellows = 0;

        this.con_yellow_start_timer = this.get_yellow_start_timer();

        this.defeated_formations = 0; // number of ended formation attacks
        this.fleed_spies = 0; // number of spy ships that got away

        if (objects) {
            var to_delete = [];
            objects.forEach(o => {
                switch (o.type) {
                    case 'enemy':
                    case 'base-bullet':
                        to_delete.push(o); break;
                }
            });
            to_delete.forEach(o => {
                delete_object(o);
            });
        }
    }

    get_yellow_start_timer() {
        var delay = Math.random() * 2 + 3;
        return this.timer + delay;
    }
    get_yellow_spawn_interval() {
        return Math.random() * 2 + 1;
    }

    spy_intel() {
        this.fleed_spies++;
        if (this.fleed_spies >= 2) {
            this.set_condition('red');
        }
    }

    position_enemy_around_player(new_enemy, spawn_z, spawn_radius) {
        var spawn_angle = Math.random() * 2 * Math.PI;

        var new_xyz = [
            spawn_radius * Math.cos(spawn_angle),
            spawn_radius * Math.sin(spawn_angle),
            spawn_z
        ];
        new_xyz = m4.apply_transform(new_xyz, player.rotation_matrix);
        new_xyz = v3.plus(new_xyz, [player.x, player.y, player.z]);
        [new_enemy.x, new_enemy.y, new_enemy.z] = new_xyz;

        return spawn_angle;
    }

    report_base_destroyed(base) {
        var base_i = bases.indexOf(base);
        if (base_i != -1) {
            bases.splice(base_i, 1);
        }
        if (!bases.length) {
            this.win_level();
        }
    }

    win_level() {
        sounds.level_win.play();
    }

    spawn_spy() {
        var spy = new Enemy('spy');
        spy.ai_mode = 'spy';
        sounds.spy_ship_sighted.play();

        var spawn_angle = this.position_enemy_around_player(spy, -30, 35);

        var rel_to_player = spy.get_rel_to_player();
        var up = m4.apply_transform([0, 1, 0], player.rotation_matrix);
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

        if (!this.num_enemies && this.condition != 'red') {
            this.sound_manager.quiet_player_sound();
            sounds.enemy_drive_loop.play(true);
        }

        this.num_enemies++;
        console.log("spawned enemy (", this.num_enemies, ")");
        
        if (this.condition == 'yellow') {
            this.num_in_wave--;
            if (this.num_in_wave > 0) {
                this.spawn_interval = this.get_yellow_spawn_interval();
                this.schedule_spawn();
            } else {
                console.log("spawn infinitely later");
                this.schedule_spawn(Infinity);
            }
        } else if (this.condition == 'red') {
            this.schedule_spawn();
        }
    }

    lose_enemy() {
        this.num_enemies--;
        console.log("lost enemy (", this.num_enemies, ")");
        if (!this.num_enemies 
            && this.condition != 'red'
            && !this.formation_active
            && player.state == 'driving') {
            sounds.enemy_drive_loop.stop();
            sounds.player_drive_loop.play(true);
        }
        if (this.condition == 'yellow'
            && !this.num_enemies
            && this.num_in_wave <= 0) {
            this.set_condition('green');
        }
    }

    spawn_formation() {
        // don't spawn a formation if there aren't any bases
        if (!bases.length) return;

        sounds.battle_stations.play();
        sounds.formation_loop.play(true);
        this.sound_manager.quiet_player_sound();
        sounds.enemy_drive_loop.stop();

        var f_base = bases[Math.floor(Math.random() * bases.length)];
        this.formation = new Formation(f_base.x, f_base.y, f_base.z);
        this.formation_active = true;
    }

    end_formation() {
        this.formation_active = false;
        sounds.formation_loop.stop();

        // If enough formations are defeated, Condition Red is triggered.
        this.defeated_formations++;
        if (this.defeated_formations == 4) {
            this.set_condition('red');
        } else {
            if (player.state == 'driving') {
                if (this.num_enemies) {
                    sounds.enemy_drive_loop.play(true);
                } else {
                    sounds.player_drive_loop.play(true);
                }
            }
        }
    }

    special_yellow_start() {
        // never do anything special on the first yellow
        if (this.num_yellows <= 1) return;

        var round_no = 1;
        // odds are calculated based on the round number,
        // and on the number of Condition Yellows triggered so far
        var odds = (this.num_yellows - 3 + round_no / 2) * 0.2;
        if (odds > 0.75) odds = 0.75;
        if (odds < 0) odds = 0;

        if (Math.random() < odds) {
            if (Math.random() > 0.5) {
                this.spawn_formation();
            } else {
                this.spawn_spy();
            }
            return true;
        }
        return false;
    }

    set_condition(new_con) {
        var old_con = this.condition;
        this.condition = new_con;
        switch (new_con) {
            case 'red':
                this.spawn_interval = 0.5;
                this.max_num_enemies = 9;
                this.schedule_spawn();
                switch (old_con) {
                    case 'red': break; // red to red - do nothing
                    default: this.sound_manager.start_condition_red();
                }
                break;
            case 'yellow':
                this.max_num_enemies = 4;
                this.num_in_wave = Math.floor(Math.random() * 4) + 3;
                this.schedule_spawn(1.5);
                this.con_yellow_start_timer = Infinity;
                switch (old_con) {
                    case 'green': // green to yellow - "Alert! Alert!"
                        this.num_yellows++;
                        if (!this.special_yellow_start()) {
                            sounds.alert_alert.play();
                        }
                        break;
                    case 'red':
                        this.sound_manager.end_condition_red();
                        break;
                }
                break;
            case 'green':
                this.con_yellow_start_timer = this.get_yellow_start_timer();
                switch (old_con) {
                    case 'red':
                        this.sound_manager.end_condition_red();
                        break;
                }
                break;
        }
    }

    schedule_spawn(time) {
        time = time || this.spawn_interval;
        this.spawn_timer = this.timer + time;
    }

    update(dt) {
        this.timer += dt;
        this.sound_manager.update_pan();

        //don't spawn unless the player is driving
        //and we have less than the maximum number of enemies
        if (player.state != 'driving' ||
            this.num_enemies >= this.max_num_enemies ||
            this.formation_active) {
            return;
        }

        if (this.timer >= this.con_yellow_start_timer &&
            this.condition == 'green') {
            this.set_condition('yellow');
        }

        if (this.condition != 'green' && this.timer >= this.spawn_timer) {
            this.spawn_enemy();
        }
    }
}
