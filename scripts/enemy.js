class Enemy extends Explodable {
    constructor(enemy_type) {
        var model; var texture; var explode_sound; var worth;
        switch(enemy_type) {
            case 'p':
                model = models.enemy_p;
                texture = textures.enemy_p;
                explode_sound = sounds.p_type_hit;
                worth = 60;
                break;
            case 'e':
                model = models.enemy_e;
                texture = textures.enemy_e;
                explode_sound = sounds.e_type_hit;
                worth = 70;
                break;
            case 'spy':
                model = models.enemy_spy;
                texture = textures.enemy_spy;
                explode_sound = sounds.i_type_spy_hit;
                worth = Math.floor(Math.random() * 3 + 1) * 500;
                break;
            case 'i':
            default:
                model = models.enemy_i;
                texture = textures.enemy_i;
                explode_sound = sounds.i_type_spy_hit;
                worth = 50;
                break;
        }

        super(model, texture);
        this.explode_sound = explode_sound;
        this.worth = worth;
        this.maneuver_completed = false;

        //collider: identical for all enemies except the E-Type
        if (enemy_type == 'e') {
            this.collider = new ColliderPrism(0, 0, 0, 0.5, 0.5, 1);
        } else {
            this.collider = new ColliderPrism(0, 0, 0, 1, 0.5, 1);
        }
        all_colliders.push(this);

        //the E-Type enemy is a missile, so let's give it a spin effect
        if (enemy_type == 'e') {
            this.r_vz = 4;
            this.r_z = 0;
        }

        this.type = 'enemy';
        this.explosion_properties = {
            palette: explosion_palettes.enemy,
        };

        //tracking properties
        this.follow_angle = 0;
        this.follow_wobble = 6;
        this.drive_speed = 19.5;
        this.age = 0;
    }

    explode() {
        //let the spawner know this enemy died
        if (!this.is_in_formation) {
            spawner.lose_enemy();
        }
        super.explode();
    }

    hone_then_straight(dt) {
        var rel_to_player = this.get_rel_to_player();

        var dist_sq_player = (
              rel_to_player[0] * rel_to_player[0]
            + rel_to_player[1] * rel_to_player[1]
            + rel_to_player[2] * rel_to_player[2]
        );

        if (!this.maneuver_completed) {
            //get the location of a point in front of the player
            var in_front_of_player = [0, 0, -15];
            in_front_of_player = m4.apply_transform(
                in_front_of_player, player.rotation_matrix);
            in_front_of_player = v3.plus(in_front_of_player,
                [player.x, player.y, player.z]);

            var rel_to_front = this.get_rel_to(...in_front_of_player);
            if (dist_sq_player > 600) {
                //get "up" in the player's frame of reference
                var up = m4.apply_transform([0, 1, 0], player.rotation_matrix);

                this.rotation_matrix = m4.lookAt(
                    [0, 0, 0],
                    rel_to_front,
                    up,
                );
                this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
                    Math.PI);
            } else {
                // once it's close to the player, the maneuver is completed
                this.maneuver_completed = true;
            }
        }

        // if the maneuver is completed, we check if it's time to despawn
        if (this.maneuver_completed && dist_sq_player > 800) {
            spawner.lose_enemy();
            this.remove();
        }

        this.move(0, 0, -this.drive_speed * dt);
    }

    straight(dt) {
        // just move forward in a straight line - no rotation changes
        this.move(0, 0, -this.drive_speed * dt);

        var rel_to_player = this.get_rel_to_player();
        var dist_sq_player = v3.len_sq(rel_to_player);
        if (dist_sq_player > 1000) {
            spawner.lose_enemy();
            this.remove();
        }
    }

    spy_maneuver(dt) {
        // the spy just moves forward in a straight line - no rotation changes
        this.move(0, 0, -this.drive_speed * dt);

        // the spy is on a timer - if it expires, it "reports intel"
        // (i.e., counts toward triggering Condition Red)
        this.maneuver_age += dt;
        if (this.maneuver_age > 10) {
            this.drive_speed = 40;
        }
        if (this.maneuver_age > 12) {
            spawner.spy_intel();
            this.remove();
        }
    }

    follow_player_with_wobble(dt) {
        var rel_to_player = this.get_rel_to_player();
        var dist_sq_player = v3.len_sq(rel_to_player);

        // only wobble if close to the player
        var wobble = dist_sq_player < 100 ? this.follow_wobble : 0;

        var up = m4.apply_transform([0, 1, 0], player.rotation_matrix);

        this.rotation_matrix = m4.lookAt(
            [0, 0, 0],
            rel_to_player,
            up,
        );
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            Math.PI);

        this.follow_angle = (this.follow_angle + 2 * dt) % (2 * Math.PI);

        this.move(
            wobble * Math.cos(this.follow_angle) * dt,
            wobble * Math.sin(this.follow_angle) * dt,
            -this.drive_speed * dt
        );

        var bank_angle = Math.sin(this.follow_angle) / 4;
        this.rotation_matrix = m4.rotate_z(this.rotation_matrix,
            bank_angle);
    }

    close_in(dt) {
        this.follow_player_with_wobble(dt);

        var rel_to_player = this.get_rel_to_player();
        var dist_sq_player = (
              rel_to_player[0] * rel_to_player[0]
            + rel_to_player[1] * rel_to_player[1]
            + rel_to_player[2] * rel_to_player[2]
        );

        if (dist_sq_player < 700) {
            this.drive_speed = 20.1;
        }
    }

    explodable_update(dt) {
        super.update(dt);
    }

    update(dt) {
        this.age += dt;
        switch(this.ai_mode) {
            case 'missile':
                this.straight(dt);
                //if (this.age > 1) this.hone_then_straight(dt);
                //else this.straight(dt);
                break;
            case 'close-in':
                this.close_in(dt);
                break;
            case 'dodge-me':
                this.hone_then_straight(dt);
                break;
            case 'spy':
                this.spy_maneuver(dt);
                break;
            default:
                this.follow_player_with_wobble(dt);
        }
        this.explodable_update(dt);

        // cosmetic rotation for E-Type missile spin
        if (this.r_vz)
            this.r_z += this.r_vz * dt;
    }

    render() {
        if (this.r_vz) {
            var orig_rotation = this.rotation_matrix;
            this.rotation_matrix = m4.rotate_z(this.rotation_matrix, this.r_z);
            super.render();
            this.rotation_matrix = orig_rotation;
        } else {
            super.render();
        }
    }
}
