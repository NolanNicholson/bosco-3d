const PLAYER_DRIVE_SPEED = 20;

class Player {
    constructor(ship_model_asset, ship_texture_asset) {
        this.type = 'player';

        this.ship_obj = new ObjTexture(ship_model_asset, ship_texture_asset);

        //state: one of 'none', 'spawning', 'driving', 'exploded'
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
        this.pitch = 0; this.yaw = 0;
        this.pitch_target = 0; this.yaw_target = 0;
        this.tack_anim_speed = 0.1;
        this.pitch_speed = 2;
        this.yaw_speed = 2;

        //current rotation
        this.rotation_matrix = m4.identity();

        //assets
        this.ship_model_asset = ship_model_asset;
        this.ship_texture_asset = ship_texture_asset;

        //bullet info
        this.max_bullets = 8;
        this.bullets = [];
        for (var i = 0; i < this.max_bullets; i++) {
            this.bullets.push(new PlayerBullet(this));
        }

        //collider information (self, bullets)
        this.collider = new ColliderPrism(0, 0, 0, 1.2, 0.5, 0.9);
        all_colliders.push(this);
    }

    fire() {
        if (!this.bullets[0].active && !this.bullets[1].active) {
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
            default:
                this.update_driving(dt);
        }
    }

    update_spawning(dt) {
        this.spawn_timer += dt;
        if (this.spawn_timer >= this.spawn_time) {
            this.takeoff();
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

        //use a movement matrix to get new ship coordinates
        var movement_matrix = m4.identity();

        movement_matrix = m4.translate(movement_matrix,
            this.ship_obj.x, this.ship_obj.y, this.ship_obj.z);

        movement_matrix = m4.multiply(movement_matrix, this.rotation_matrix);

        // Drive the ship forward, and strafe it if applicable
        movement_matrix = m4.translate(movement_matrix,
            0, 0, -this.drive_speed * dt);
        if (this.strafing) {
            var ss = this.strafe_speed * dt;
            var move_x = this.yawing_right - this.yawing_left;
            var move_y = this.pitching_up - this.pitching_down;
            movement_matrix = m4.translate(movement_matrix,
                ss * move_x, ss * move_y, 0);
        }

        this.ship_obj.x = movement_matrix[12];
        this.ship_obj.y = movement_matrix[13];
        this.ship_obj.z = movement_matrix[14];

        //update active bullets
        this.bullets.forEach(b => {
            if (b.active) {
                b.update(dt);
            }
        });

        //update collider
        this.collider.pos = [this.ship_obj.x, this.ship_obj.y, this.ship_obj.z];
        this.collider.rotation_matrix = this.rotation_matrix;

        this.collider.rotation_matrix = m4.rotate_x(
            this.collider.rotation_matrix, this.pitch);
        this.collider.rotation_matrix = m4.rotate_z(
            this.collider.rotation_matrix, this.yaw);

        this.ship_obj.bounds_check();
    }

    spawn() {
        this.ship_obj.x = player_start_position[0];
        this.ship_obj.y = player_start_position[1];
        this.ship_obj.z = player_start_position[2];
        sounds.blast_off.play();
        this.spawn_timer = 0;
        this.state = 'spawning';
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
        sounds.player_drive_loop.play(true);
    }

    collision_event(other) {
        //TODO
    }

    render() {
        var model_matrix = m4.identity();
        model_matrix = m4.translate(model_matrix,
            this.ship_obj.x, this.ship_obj.y, this.ship_obj.z);

        //ship's actual rotation
        model_matrix = m4.multiply(model_matrix, this.rotation_matrix);

        //(purely cosmetic) pitch/yaw rotations
        model_matrix = m4.rotate_x(model_matrix, this.pitch * 0.7);
        model_matrix = m4.rotate_z(model_matrix, this.yaw);

        gl.bindTexture(gl.TEXTURE_2D, this.ship_texture_asset.texture);
        this.ship_model_asset.render(model_matrix);

        //update active bullets
        this.bullets.forEach(b => {
            if (b.active) {
                b.render();
            }
        });
    }
}
