const PLAYER_DRIVE_SPEED = 20;

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
        this.strafing = false;

        //ship speed
        this.drive_speed = PLAYER_DRIVE_SPEED;
        this.strafe_speed = 10;

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
        all_colliders.push(this);

        //explosion info
        this.explosion_properties = {
            palette: explosion_palettes.player,
            size: 3,
            max_age: 1.5,
        };
        this.explosion_time = 0;
        this.explosion_timer = 2;
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
                this.yawing_left = true;
                break;
            case 68: // D
                this.yawing_right = true;
                break;
            case 87: // W
                this.pitching_down = true;
                break;
            case 83: // S
                this.pitching_up = true;
                break;
            case 32: // Spacebar
                this.fire();
                break;
            case 16: // Shift
                this.strafing = true;
                break;
            case 79: // O
                if (this.drive_speed) this.drive_speed = 0;
                else this.drive_speed = PLAYER_DRIVE_SPEED;
                break;
            default:
                console.log("Key Down:", e.keyCode);
        }
    }

    handle_keyup(e) {
        switch(e.keyCode) {
            case 65: // A
                this.yawing_left = false;
                break;
            case 68: // D
                this.yawing_right = false;
                break;
            case 87: // W
                this.pitching_down = false;
                break;
            case 83: // S
                this.pitching_up = false;
                break;
            case 32: // Spacebar
                break;
            case 16: // Shift
                this.strafing = false;
                break;
            default:
                console.log("Key Up:", e.keyCode);
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

    update_spawning(dt) {
        this.spawn_timer += dt;
        if (this.spawn_timer >= this.spawn_time) {
            this.takeoff();
        }
    }

    update_exploding(dt) {
        this.explosion.update(dt);
        if (this.explosion.age > this.explosion.max_age) {
            spawner.end_condition_red();
            this.state = 'exploded';
            this.explosion_time = 0;
        }
    }

    update_exploded(dt) {
        this.explosion_time += dt;
        if (this.explosion_time >= this.explosion_timer) {
            this.spawn();
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

        // If the ship is NOT strafing,
        // update rotation matrix using pitch and yaw.
        if (!this.strafing) {
            this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
                this.pitch * this.pitch_speed * dt);
            this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
                this.yaw * this.yaw_speed * dt);
        }

        // Determine local motion, then move.
        if (this.strafing) {
            var ss = this.strafe_speed * dt;
            var dx = ss * (this.yawing_right - this.yawing_left);
            var dy = ss * (this.pitching_up - this.pitching_down);
        } else {
            var dx = 0; var dy = 0;
        }
        var dz = -this.drive_speed * dt;
        this.move(dx, dy, dz);

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

    spawn() {
        //reset current rotation, pitch, and yaw
        this.rotation_matrix = m4.identity();
        this.pitch = 0; this.yaw = 0;
        this.pitch_target = 0; this.yaw_target = 0;

        [this.x, this.y, this.z] = player_start_position;
        this.collider.pos = [this.x, this.y, this.z];
        sounds.blast_off.play();
        this.spawn_timer = 0;
        this.state = 'spawning';

        //spawning costs a life
        lives--;
        console.log(lives);
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
        if (this.state == 'driving') {
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
