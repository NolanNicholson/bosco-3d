function delete_object(o) {
    var collider_list = all_colliders;
    var object_list = objects;

    var collider_index = collider_list.indexOf(o);
    if (collider_index != -1) collider_list.splice(collider_index, 1);

    var obj_index = object_list.indexOf(o);
    if (obj_index != -1) object_list.splice(obj_index, 1);

    delete o;
}

class Explodable extends ObjTexture {
    constructor(model, texture) {
        super(model, texture);
        this.exploded = false;
        this.explosion_properties = {};
        this.remove_collider_when_exploded = true;
    }

    collision_event(other) {
        if (!this.exploded) {
            this.explode();
        }
    }

    delete_collider() {
        //remove this object's collider from the master list (if it's in it)
        var collider_list = all_colliders;
        var collider_index = collider_list.indexOf(this);
        if (collider_index != -1)
            collider_list.splice(collider_index, 1);
    }

    explode() {
        this.explode_sound.play();
        this.exploded = true;
        this.explosion = new Explosion(this.explosion_properties);
        this.explosion.relocate(this.x, this.y, this.z);

        if (this.remove_collider_when_exploded) {
            this.delete_collider();
        }

        if (this.worth) {
            score += this.worth;
        }
    }

    sync_collider() {
        this.collider.pos = [this.x, this.y, this.z];
        this.collider.rotation_matrix = this.rotation_matrix;
    }

    update(dt) {
        if (this.exploded) {
            this.explosion.update(dt);
            if (this.explosion.age > this.explosion.max_age) {
                delete_object(this);
            }
        } else {
            super.update(dt);

            //sync collider with main object
            if (this.collider) {
                this.sync_collider();
            }
        }
    }

    render() {
        if (this.exploded) {
            this.explosion.render();
        } else {
            super.render();
        }
    }
}

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

    get_rel_to_player() {
        var rel_to_player = v3.minus(
            [this.x, this.y, this.z],
            [player.ship_obj.x, player.ship_obj.y, player.ship_obj.z]);

        // adjust the relative coordinates to loop over the level bounds
        if (Math.abs(rel_to_player[0]) > level_size.x / 2)
            rel_to_player[0] -= Math.sign(rel_to_player[0]) * level_size.x;
        if (Math.abs(rel_to_player[1]) > level_size.y / 2)
            rel_to_player[1] -= Math.sign(rel_to_player[1]) * level_size.y;
        if (Math.abs(rel_to_player[2]) > level_size.z / 2)
            rel_to_player[2] -= Math.sign(rel_to_player[2]) * level_size.z;

        return rel_to_player;
    }

    snap_into_level() {
        while (this.x > level_bounds.x.max) this.x -= level_size.x;
        while (this.y > level_bounds.y.max) this.y -= level_size.y;
        while (this.z > level_bounds.z.max) this.z -= level_size.z;
        while (this.x < level_bounds.x.min) this.x += level_size.x;
        while (this.y < level_bounds.y.min) this.y += level_size.y;
        while (this.z < level_bounds.z.min) this.z += level_size.z;
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
        this.follow_player_with_wobble(dt);
        this.explodable_update(dt);
    }
}

class CosmoMine extends Explodable {
    constructor() {
        super(models.cosmo_mine, textures.cosmo_mine);
        this.collider = new ColliderSphere(0, 0, 0, 1.7);
        this.scale = 2;
        all_colliders.push(this);
        this.explosion_properties = {
            palette: explosion_palettes.cosmo_mine,
            size: 12,
            num_shrapnel: 60,
            num_clouds: 60,
            max_age: 1,
        };
        this.explode_sound = sounds.mine_hit;
        this.remove_collider_when_exploded = false;

        this.type = 'mine';
        this.worth = 20;
    }

    update(dt) {
        super.update(dt);
        //since the mine's explosion (uniquely) has a collider,
        //we also need to update it
        if (this.exploded) {
            this.collider.radius = this.explosion.scale;
        }
    }
}

class Asteroid extends Explodable {
    constructor(scale) {
        // choose a random model
        var model = (Math.random() > 0.5 ? models.asteroid1 : models.asteroid2);
        super(model, textures.asteroid);

        this.scale = scale;
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
            Math.random() * 2 * Math.PI);
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            Math.random() * 2 * Math.PI);

        this.collider = new ColliderSphere(0, 0, 0, this.scale);
        all_colliders.push(this);

        this.explode_sound = sounds.asteroid_hit;
        this.explosion_properties = {
            size: this.scale * 1.3,
        }
        this.type = 'asteroid';
        this.worth = 10;
    }
}
