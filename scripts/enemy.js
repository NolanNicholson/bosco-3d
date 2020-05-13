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
        if (enemy_type == 'e')
            this.r_vz = 4;

        this.type = 'enemy';
        this.explosion_properties = {
            palette: explosion_palettes.enemy,
        };

        //tracking properties
        this.follow_angle = 0;
        this.follow_wobble = 6;
        this.drive_speed = 19.5;
    }

    explode() {
        //let the spawner know this enemy died
        if (!this.is_in_formation) {
            spawner.lose_enemy();
        }
        super.explode();
    }

    get_rel_to(x, y, z) {
        var rel_to_player = v3.minus([this.x, this.y, this.z], [x, y, z]);

        // adjust the relative coordinates to loop over the level bounds
        if (Math.abs(rel_to_player[0]) > level_size.x / 2)
            rel_to_player[0] -= Math.sign(rel_to_player[0]) * level_size.x;
        if (Math.abs(rel_to_player[1]) > level_size.y / 2)
            rel_to_player[1] -= Math.sign(rel_to_player[1]) * level_size.y;
        if (Math.abs(rel_to_player[2]) > level_size.z / 2)
            rel_to_player[2] -= Math.sign(rel_to_player[2]) * level_size.z;

        return rel_to_player;
    }

    get_rel_to_player() {
        return this.get_rel_to(
            player.ship_obj.x, player.ship_obj.y, player.ship_obj.z);
    }

    snap_into_level() {
        while (this.x > level_bounds.x.max) this.x -= level_size.x;
        while (this.y > level_bounds.y.max) this.y -= level_size.y;
        while (this.z > level_bounds.z.max) this.z -= level_size.z;
        while (this.x < level_bounds.x.min) this.x += level_size.x;
        while (this.y < level_bounds.y.min) this.y += level_size.y;
        while (this.z < level_bounds.z.min) this.z += level_size.z;
    }

    hone_then_straight(dt) {
        var rel_to_player = this.get_rel_to_player();

        var dist_sq_player = (
              rel_to_player[0] * rel_to_player[0]
            + rel_to_player[1] * rel_to_player[1]
            + rel_to_player[2] * rel_to_player[2]
        );

        if (!this.maneuver_completed) {
            var in_front_of_player = v3.plus(
                m4.translate(player.rotation_matrix,
                    0, 0, -10).slice(12, 15),
                [player.ship_obj.x, player.ship_obj.y, player.ship_obj.z]);
            var rel_to_front = this.get_rel_to(...in_front_of_player);
            if (dist_sq_player > 600) {
                //TODO: shouldn't need a full mmult here
                var up = m4.translate(
                    player.rotation_matrix, 0, 1, 0).slice(12, 15);

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
            console.log("enemy despawned");
            spawner.lose_enemy();
            delete_object(this);
        }

        var movement_matrix = this.rotation_matrix;
        movement_matrix = m4.translate(this.rotation_matrix,
            0, 0, -this.drive_speed * dt);
        this.x += movement_matrix[12];
        this.y += movement_matrix[13];
        this.z += movement_matrix[14];
        this.snap_into_level();
    }

    follow_player_with_wobble(dt) {
        var rel_to_player = this.get_rel_to_player();

        var dist_sq_player = (
              rel_to_player[0] * rel_to_player[0]
            + rel_to_player[1] * rel_to_player[1]
            + rel_to_player[2] * rel_to_player[2]
        );
        // only wobble if close to the player
        var wobble = dist_sq_player < 100 ? this.follow_wobble : 0;

        //TODO: shouldn't need a full mmult here
        var up = m4.translate(player.rotation_matrix, 0, 1, 0).slice(12, 15);

        this.rotation_matrix = m4.lookAt(
            [0, 0, 0],
            rel_to_player,
            up,
        );
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            Math.PI);

        this.follow_angle = (this.follow_angle + 2 * dt) % (2 * Math.PI);

        var movement_matrix = this.rotation_matrix;
        movement_matrix = m4.translate(this.rotation_matrix,
            wobble * Math.cos(this.follow_angle) * dt,
            wobble * Math.sin(this.follow_angle) * dt,
            -this.drive_speed * dt);
        this.x += movement_matrix[12];
        this.y += movement_matrix[13];
        this.z += movement_matrix[14];
        this.snap_into_level();

        var bank_angle = Math.sin(this.follow_angle) / 4;
        this.rotation_matrix = m4.rotate_z(this.rotation_matrix,
            bank_angle);
    }

    explodable_update(dt) {
        super.update(dt);
    }

    update(dt) {
        switch(this.ai_mode) {
            case 'dodge-me':
                this.hone_then_straight(dt);
                break;
            default:
                this.follow_player_with_wobble(dt);
        }
        this.explodable_update(dt);
    }
}
