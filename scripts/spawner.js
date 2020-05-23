class SoundManager {
    constructor() {
        this.sound_index = [
            [],
            [sounds.con_red_loop, sounds.con_red_voice],
            [sounds.formation_loop],
            [sounds.enemy_drive_loop],
            [sounds.player_drive_loop],
        ]
        this.active_sound = 0;
    }

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
    }

    update() {
        var previous_sound = this.active_sound;
        if (player.state != 'driving') {
            this.active_sound = 0; // no sound - when player isn't driving
        } else if (spawner.condition == 'red') {
            this.active_sound = 1; // condition red
        } else if (spawner.formation_active) {
            this.active_sound = 2; // formation attack
        } else if (spawner.num_enemies) {
            this.active_sound = 3; // enemy attack
        } else {
            this.active_sound = 4; // player driving, no enemies
        }

        // change the sound if needed
        if (previous_sound != this.active_sound) {
            console.log("enemies", spawner.num_enemies,
                "state", this.active_sound);
            if (previous_sound == 4) {
                this.quiet_player_sound(); // need to also prevent loop start
            } else {
                this.sound_index[previous_sound].forEach(snd => {
                    snd.stop();
                });
            }
            if (previous_sound == 0 && this.active_sound == 4) {
                // don't do anything - the player has special startup noise
            } else {
                this.sound_index[this.active_sound].forEach(snd => {
                    snd.play(true);
                });
            }
        }

        // pan if needed
        if (this.active_sound >= 2 && this.active_sound <= 3) {
            this.update_pan();
        }
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
        var pan = (x / Math.sqrt(x*x + z*z)) * 0.8;

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
        this.won_level = false;

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
                o.remove();
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
        this.condition = 'green';
        player.victory();

        // stop all sounds
        sounds.enemy_drive_loop.stop();
        sounds.formation_loop.stop();
        sounds.con_red_voice.stop();
        sounds.con_red_loop.stop();
        this.sound_manager.quiet_player_sound();

        // delete all enemies and base bullets
        var deletions = [];
        objects.forEach(obj => {
            switch (obj.type) {
                case 'enemy':
                case 'base-bullet':
                    deletions.push(obj);
                    break;
            }
        });
        deletions.forEach(obj => {
            obj.remove();
        });

        this.won_level = true;
        this.level_win_sound_timer = 1.5;
        this.level_win_advance_timer = 3.5;
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

    add_new_enemy(new_enemy) {
        objects.push(new_enemy);
        this.new_enemy = new_enemy;
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

        this.add_new_enemy(new_enemy);

        if (this.condition == 'yellow') {
            this.num_in_wave--;
            if (this.num_in_wave > 0) {
                this.spawn_interval = this.get_yellow_spawn_interval();
                this.schedule_spawn();
            } else {
                this.schedule_spawn(Infinity);
            }
        } else if (this.condition == 'red') {
            this.schedule_spawn();
        }
    }

    lose_enemy() {
        this.num_enemies--;
        /*
        console.log("enemy despawned,",
            this.num_enemies, "left alive,",
            this.num_in_wave, "left in wave",
        );
        */
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

        var f_base = bases[Math.floor(Math.random() * bases.length)];
        this.formation = new Formation(f_base.x, f_base.y, f_base.z);
        this.formation_active = true;
    }

    end_formation() {
        this.formation_active = false;

        // If enough formations are defeated, Condition Red is triggered.
        this.defeated_formations++;
        if (this.defeated_formations == 4) {
            this.set_condition('red');
        }
    }

    special_yellow_start() {
        // never do anything special on the first yellow
        if (this.num_yellows <= 1) return;

        // odds are calculated based on the round number,
        // and on the number of Condition Yellows triggered so far
        var odds = (this.num_yellows + round / 2) * 0.2;
        if (odds > 0.75) odds = 0.75;
        if (odds < 0) odds = 0;

        if (Math.random() < odds) {
            if (Math.random() > 0.4) {
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
                }
                break;
            case 'green':
                this.con_yellow_start_timer = this.get_yellow_start_timer();
                break;
        }
    }

    schedule_spawn(time) {
        time = time || this.spawn_interval;
        this.spawn_timer = this.timer + time;
    }

    update_main(dt) {
        this.timer += dt;
        this.sound_manager.update();

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

    update(dt) {
        if (this.won_level) {
            this.level_win_sound_timer -= dt;
            this.level_win_advance_timer -= dt;
            if (this.level_win_sound_timer <= 0) {
                sounds.level_win.play();
                this.level_win_sound_timer = Infinity;
            }
            if (this.level_win_advance_timer <= 0) {
                round++;
                load_level();
                this.level_win_advance_timer = Infinity;
            }
        } else {
            this.update_main(dt);
        }
    }
}
