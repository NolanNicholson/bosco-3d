class Player extends ObjTexture {
    constructor() {
        super(models.player, textures.player);

        this.type = 'player';

        //state: one of 'none', 'spawning', 'driving', 'exploding', 'exploded'
        this.state = 'none';
        this.spawn_timer = 0;
        this.spawn_time = 1.2;

        //movement flags
        this.yawing_left = false;       this.yawing_right = false;
        this.pitching_up = false;         this.pitching_down = false;

        //ship speed
        this.drive_speed = 20;

        //direction and adjustment speed
        this.tack_anim_speed = 0.1;
        this.pitch_speed = 2;
        this.yaw_speed = 2;

        //bullet info
        this.max_bullets = 8;
        this.bullets = [];
        for (var i = 0; i < this.max_bullets; i++) {
            this.bullets.push(new PlayerBullet());
        }

        //collider information (self, bullets)
        this.collider = new ColliderPrism(0, 0, 0, 1.2, 0.5, 0.9);

        //explosion info
        this.explosion_properties = {
            palette: explosion_palettes.player,
            size: 3,
            max_age: 1.5,
        };
        this.explosion_time = 0;
        this.explosion_timer = 1;
    }

    fire() {
        if (this.state == 'driving'
            && !this.bullets[0].active && !this.bullets[1].active) {
            sounds.player_shoot.play();
            var first_bullet = this.bullets.shift();
            first_bullet.activate();

            var second_bullet = this.bullets.shift();
            second_bullet.activate();
            second_bullet.bullet_speed *= -1;

            this.bullets.push(first_bullet, second_bullet);
        }
    }

    handle_keydown(e) {
        switch(e.keyCode) {
            case 65: // A
            case 37: // left arrow
                this.yawing_left = true;
                break;
            case 68: // D
            case 39: // right arrow
                this.yawing_right = true;
                break;
            case 87: // W
            case 38: // up arrow
                this.pitching_down = true;
                break;
            case 83: // S
            case 40: // down arrow
                this.pitching_up = true;
                break;
            case 32: // Spacebar
                this.fire();
                break;
        }
    }

    handle_keyup(e) {
        switch(e.keyCode) {
            case 65: // A
            case 37: // left arrow
                this.yawing_left = false;
                break;
            case 68: // D
            case 39: // right arrow
                this.yawing_right = false;
                break;
            case 87: // W
            case 38: // up arrow
                this.pitching_down = false;
                break;
            case 83: // S
            case 40: // down arrow
                this.pitching_up = false;
                break;
            case 32: // Spacebar
                break;
        }
    }

    update(dt) {
        switch (this.state) {
            case 'spawning':
                this.update_spawning(dt);
                break;
            case 'exploding':
                this.update_exploding(dt);
                break;
            case 'exploded':
                this.update_exploded(dt);
                break;
            case 'driving':
                this.update_driving(dt);
                break;
        }
    }

    victory() {
        this.bullets.forEach(b => {
            b.deactivate();
        });
        this.state = 'victory';
    }

    update_spawning(dt) {
        this.spawn_timer += dt;
        if (this.spawn_timer >= this.spawn_time) {
            this.takeoff();
        }
    }

    update_exploding(dt) {
        this.explosion.update(dt);
        if (this.explosion.age > this.explosion.max_age) {
            spawner.set_condition('green');
            this.state = 'exploded';
            this.explosion_time = 0;
        }
    }

    update_exploded(dt) {
        this.explosion_time += dt;
        if (this.explosion_time >= this.explosion_timer) {
            player_ready_screen.begin_respawn();
            this.state = 'absent';
        }
    }

    update_driving(dt) {
        this.yaw_target = (this.yawing_left - this.yawing_right) * Math.PI / 6;
        this.pitch_target = (this.pitching_up - this.pitching_down)
            * Math.PI / 6;

        if (this.yaw > this.yaw_target) {
            this.yaw -= Math.min(
                this.yaw - this.yaw_target, this.tack_anim_speed);
        } else if (this.yaw < this.yaw_target) {
            this.yaw += Math.min(
                this.yaw_target - this.yaw, this.tack_anim_speed);
        }
        if (this.pitch > this.pitch_target) {
            this.pitch -= Math.min(
                this.pitch - this.pitch_target, this.tack_anim_speed);
        } else if (this.pitch < this.pitch_target) {
            this.pitch += Math.min(
                this.pitch_target - this.pitch, this.tack_anim_speed);
        }

        // Update rotation matrix using pitch and yaw.
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
            this.pitch * this.pitch_speed * dt);
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            this.yaw * this.yaw_speed * dt);

        var dz = -this.drive_speed * dt;
        this.move(0, 0, dz);

        //update active bullets
        this.bullets.forEach(b => {
            if (b.active) {
                b.update(dt);
            }
        });

        //update collider
        this.collider.pos = [this.x, this.y, this.z];
        this.collider.rotation_matrix = this.rotation_matrix;

        this.collider.rotation_matrix = m4.rotate_x(
            this.collider.rotation_matrix, this.pitch);
        this.collider.rotation_matrix = m4.rotate_z(
            this.collider.rotation_matrix, this.yaw);

        this.bounds_check();
    }

    spawn(died) {
        died = died || false;

        //reset current rotation, pitch, and yaw
        this.rotation_matrix = m4.identity();
        this.pitch = 0; this.yaw = 0;
        this.pitch_target = 0; this.yaw_target = 0;

        [this.x, this.y, this.z] = player_start_position;
        this.collider.pos = [this.x, this.y, this.z];
        sounds.blast_off.play();
        this.spawn_timer = 0;
        this.state = 'spawning';
        spawner.reset_level();

        // update lives if this spawn was the result of a death
        if (died) {
            lives--;
        }
    }

    takeoff() {
        this.state = 'driving';
        this.start_drive_sound();
    }

    start_drive_sound() {
        sounds.player_drive_start.play();
        sounds.player_drive_start.source.onended = this.loop_drive_sound;
    }

    loop_drive_sound() {
        if (player.state == 'driving') {
            sounds.player_drive_loop.play(true);
        }
    }

    collision_event(other) {
        if (this.state == 'driving' && other.type != 'player_bullet') {
            this.explode();
        }
    }

    explode() {
        sounds.enemy_drive_loop.stop();
        sounds.con_red_loop.stop();
        sounds.con_red_voice.stop();
        sounds.player_drive_start.stop();
        sounds.player_drive_loop.stop();
        sounds.player_miss.play();
        this.bullets.forEach(b => {
            b.deactivate();
        });
        this.state = 'exploding';
        this.explosion = new Explosion(this.explosion_properties);
        this.explosion.relocate(this.x, this.y, this.z);
    }

    prep_model_matrix() {
        var model_matrix = m4.identity();
        model_matrix = m4.translate(model_matrix, this.x, this.y, this.z);

        //ship's actual rotation
        model_matrix = m4.multiply(model_matrix, this.rotation_matrix);

        //(purely cosmetic) pitch/yaw rotations
        model_matrix = m4.rotate_x(model_matrix, this.pitch * 0.7);
        model_matrix = m4.rotate_z(model_matrix, this.yaw);
        this.model_matrix = model_matrix;
    }

    render() {
        switch (this.state) {
            case 'exploding':
                this.explosion.render();
                break;
            case 'exploded':
            case 'absent':
                //do nothing
                break;
            default:
                super.render();
        }

        //update active bullets
        this.bullets.forEach(b => {
            if (b.active) {
                b.render();
            }
        });
    }
}
