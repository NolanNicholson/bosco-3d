class Part extends ObjTexture {
    constructor(parent_obj, model, texture) {
        super(model, texture);
        this.rel_position = [0, 0, 0];
        this.rel_rotation = m4.identity();
        this.parent_obj = parent_obj;
        this.type = 'part';
    }

    sync_with_parent() {
        var p = this.parent_obj;

        //apply rotation
        this.rotation_matrix = m4.multiply(
            p.rotation_matrix, this.rel_rotation);

        //get new coordinates
        var new_xyz = this.rel_position;
        new_xyz = m4.apply_transform(new_xyz, p.rotation_matrix);
        new_xyz = v3.scalar_mult(new_xyz, p.scale);
        new_xyz = v3.plus(new_xyz, [p.x, p.y, p.z]);
        [this.x, this.y, this.z] = new_xyz;

        this.scale = p.scale;
        if (this.collider) this.sync_collider();
    }
}

class BaseCrystal extends Part {
    constructor(parent_obj) {
        super(parent_obj, models.base_crystal, textures.base_crystal);
        this.collider = new ColliderSphere(0, 0, 0, 4);
        this.collider.group = 'base';
        this.type = 'base_crystal';
    }
    collision_event(other) {
        switch(other.type) {
            case 'player_bullet':
            case 'player':
                this.parent_obj.explode();
                break;
        }
    }
}

class BaseCoreDoor extends Part {
    constructor(parent_obj) {
        super(parent_obj, models.base_core_door, textures.base_core_side);
        this.rotation_speed = 1;
        this.collider = new ColliderMulti();
        this.collider.components = [
            new ColliderPrism(0, 0, 0, 3, 5, 1),
            new ColliderPrism(0, 0, 0, 3, 5, 1),
        ];
        this.collider.group = 'base';
        this.type = 'base_core_door';
        this.angle = 0;

        // 0.01, not 0, so that missiles don't fire on level load
        this.spawn_missile_timer = 0.01;
    }

    sync_collider() {
        var pos;
        pos = m4.apply_transform(
            [0, 0, 5], this.rotation_matrix);
        pos = v3.plus(pos, [this.x, this.y, this.z]);

        var comps = this.collider.components;
        comps[0].pos = pos;
        comps[0].rotation_matrix = this.rotation_matrix;

        pos = m4.apply_transform(
            [0, 0, -5], this.rotation_matrix);
        pos = v3.plus(pos, [this.x, this.y, this.z]);

        comps[1].pos = pos;
        comps[1].rotation_matrix = this.rotation_matrix;
    }

    spawn_missile(y_sign) {
        var new_enemy = new Enemy('e');
        new_enemy.ai_mode = 'missile';
        new_enemy.collider.group = 'base';
        new_enemy.drive_speed *= 1.5;
        spawner.add_new_enemy(new_enemy);

        var rot = m4.identity();
        rot = m4.multiply(rot, this.parent_obj.rotation_matrix);
        rot = m4.rotate_x(rot, this.angle - Math.PI / 2 * y_sign);
        new_enemy.rotation_matrix = rot;

        [new_enemy.x, new_enemy.y, new_enemy.z] = [this.x, this.y, this.z];
        new_enemy.sync_collider();

        this.spawn_missile_timer = 0.7;
    }

    spawn_missile_check(dt) {
        // don't do anything if the player isn't driving
        if (this.parent_obj.explosions) return;
        if (player.state != 'driving') return;

        // minimum delay between missile launches
        if (this.spawn_missile_timer > 0) {
            this.spawn_missile_timer -= dt;
            return;
        } else {
            var rel_to_player = this.get_rel_to_player();
            // quit if the player is too far away
            if (v3.len_sq(rel_to_player) > 2000) return;

            var inv_rot = m4.inverse(this.rotation_matrix);
            var rel_coord = m4.apply_transform(rel_to_player, inv_rot);
            this.spawn_missile(Math.sign(rel_coord[1]));
        }
    }

    update(dt) {
        super.update(dt);
        this.angle += this.rotation_speed * dt;
        this.angle %= Math.PI;
        this.rel_rotation = m4.rotation_x(this.angle);
        if (round > 1) {
            this.spawn_missile_check(dt);
        }
    }

    collision_event(other) {
        // the door is impervious to everything except the player
        // (but the player destroys the whole base)
        switch(other.type) {
            case 'player':
                this.parent_obj.explode();
                break;
        }
    }
}

class BaseCannon extends Part {
    constructor(parent_obj, is_corner) {
        super(parent_obj, models.base_ball, textures.base_ball);
        this.exploded = false;
        this.explosion = false;
        this.is_corner = is_corner
        this.type = 'base_cannon';
        this.worth = 200;

        this.collider = new ColliderSphere(0, 0, 0, 7);
        this.collider.group = 'base';

        this.shoot_timer = 0;

        this.collider_transform = false;

        if (is_corner) {
            this.arm = new Part(this, models.base_arm, textures.base_core_side);
            //this.arm = new Part(this, models.base_arm_d, textures.base_ball_d);
            this.arm.rel_position = [1, 0, 2];
            this.arm.rel_rotation = m4.rotation_y(Math.PI);
        }
    }

    explode() {
        sounds.base_cannon_hit.play();
        add_to_score(this.worth);
        this.exploded = true;
        this.explosion = new Explosion({
            size: 3 * this.parent_obj.scale,
        });
        this.explosion.x = this.x;
        this.explosion.y = this.y;
        this.explosion.z = this.z;
        if (this.is_corner)
            this.model_asset = models.base_ball_d_c;
        else
            this.model_asset = models.base_ball_d_s;
        this.texture_asset = textures.base_ball_d;

        // update collider
        this.collider = new ColliderPrism(0, 0, 0,
            this.scale / 2, this.scale * 1.2, this.scale * 1.2);
        if (this.is_corner) {
            var rel_rot = m4.rotation_y(Math.PI / 4);
            var rel_pos = [0, 0, this.scale / 2];
        } else {
            var rel_rot = m4.identity();
            var rel_pos = [-this.scale / 2, 0, 0];
        }
        this.collider_transform = { rel_rot: rel_rot, rel_pos: rel_pos };

        // update arm appearance
        if (this.arm) {
            this.arm.model_asset = models.base_arm_d;
            this.arm.texture_asset = textures.base_ball_d;
        }

        //communicate damage to the main base
        this.parent_obj.damage();
    }

    sync_collider() {
        if (this.collider_transform) {
            var rel_pos = this.collider_transform.rel_pos;
            var rel_rot = this.collider_transform.rel_rot;

            rel_pos = m4.apply_transform(rel_pos, this.rotation_matrix);

            this.collider.pos = v3.plus(
                [this.x, this.y, this.z], rel_pos);
            this.collider.rotation_matrix = m4.multiply(
                this.rotation_matrix, rel_rot);
        } else {
            super.sync_collider();
        }
    }

    collision_event(other) {
        switch(other.type) {
            case 'player':
                // getting hit by the player destroys the whole base
                this.parent_obj.explode();
                break;
            default:
                if (!this.exploded) {
                    this.explode();
                }
        }
    }

    update_cannon(dt) {
        this.shoot_timer -= dt;
        if (this.shoot_timer <= 0) {
            this.shoot_timer = Math.random() * 1.5 + 1;

            var base_bullet = new BaseBullet(this.x, this.y, this.z);
        }
    }

    update(dt) {
        super.update(dt);
        if (this.explosion) {
            this.explosion.update(dt);
            this.explosion.x = this.x;
            this.explosion.y = this.y;
            this.explosion.z = this.z;
            if (this.explosion.age >= this.explosion.max_age) {
                this.explosion = false;
            }
        } else {
            if (!this.exploded && player.state == 'driving') {
                var rel_to_player = this.get_rel_to_player();
                var dist_sq_to_player = v3.len_sq(rel_to_player);
                if (dist_sq_to_player < 3000) this.update_cannon(dt);
            }
        }

        if (this.arm) {
            this.arm.sync_with_parent();
        }
    }

    render() {
        if (this.explosion) {
            this.explosion.render();
        }
        super.render();
        if (this.arm) {
            this.arm.render();
        }
    }
}

class BaseCoreSide extends Part {
    constructor(parent_obj) {
        super(parent_obj, models.base_core_side, textures.base_core_side);
        this.collider = new ColliderPrism(0, 0, 0, 3, 6, 6);
        this.type = 'base-core-side';
        this.collider.group = 'base';

    }

    collision_event(other) {
        // the core sides are impervious to everything except the player
        // (but the player destroys the whole base)
        switch(other.type) {
            case 'player':
                this.parent_obj.explode();
                break;
        }
    }
}

class EnemyBase {
    constructor() {
        // set up the "sides" of the core
        this.core_sides = [
            new BaseCoreSide(this),
            new BaseCoreSide(this),
        ];
        this.core_sides[1].rel_rotation = m4.rotation_z(Math.PI);
        this.core_sides[0].rel_position = [ 1.5, 0, 0];
        this.core_sides[1].rel_position = [ -1.5, 0, 0];

        // set up the base cannons
        this.balls = []
        for (var i = 0; i < 6; i++) {
            var is_corner = (i > 1);
            this.balls.push(new BaseCannon(this, is_corner));
        }
        this.balls[0].rel_position = [-5, 0,  0];
        this.balls[1].rel_position = [ 5, 0,  0];
        this.balls[2].rel_position = [-2.5, 0, -4.5];
        this.balls[3].rel_position = [ 2.5, 0, -4.5];
        this.balls[4].rel_position = [-2.5, 0,  4.5];
        this.balls[5].rel_position = [ 2.5, 0,  4.5];
        this.balls[0].rel_rotation = m4.rotation_z(Math.PI);

        // some of the base cannons need to be rotated
        [4, 5].forEach(i => {
            this.balls[i].rel_rotation = m4.rotation_x(Math.PI);
        });
        [2, 4].forEach(i => {
            this.balls[i].rel_rotation = m4.rotate_z(
                this.balls[i].rel_rotation, Math.PI);
        });

        // set up the core crystal
        this.crystal = new BaseCrystal(this);

        this.parts     = [...this.balls, this.crystal, ...this.core_sides];
        this.colliders = [...this.balls, this.crystal, ...this.core_sides];

        this.rotation_matrix = m4.identity();
        this.spin_speed = 0.1;

        if (round > 0) {
            this.crystal_guard = new BaseCoreDoor(this);
            this.parts.push(this.crystal_guard);
            this.colliders.push(this.crystal_guard);
        }

        all_colliders.push(...this.colliders);

        this.explosions = false;
        this.explosion_min_pct = 0;
        this.worth = 1500;
    }

    update(dt) {
        //test rotation
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            this.spin_speed * dt);

        this.parts.forEach(part => {
            part.update(dt);
            part.sync_with_parent();
        });

        if (this.explosions) {
            var me = this;
            var explosion_pcts = [];
            this.explosions.forEach(expl => {
                if (expl.age <= expl.max_age) {
                    expl.update(dt);
                }
                explosion_pcts.push(expl.age / expl.max_age);
            });
            this.explosion_min_pct = Math.min(...explosion_pcts);
            //destroy the base once all explosions are done
            if (this.explosion_min_pct > 1) {
                me.destroy();
            }
        }
    }

    damage() {
        var unexploded_cannons = 0;
        this.balls.forEach(ball => {
            if (!ball.exploded) { unexploded_cannons += 1; }
        });

        if (!unexploded_cannons) {
            this.explode();
        }
    }

    explode() {
        add_to_score(this.worth);

        //first, remove colliders
        this.colliders.forEach(coll => {
            var i_coll = all_colliders.indexOf(coll);
            if (i_coll != -1) all_colliders.splice(i_coll, 1);
        });

        var exp_r = 6 * this.scale;
        var pal = explosion_palettes.base;
        this.explosions = [
            new Explosion({ size: exp_r, palette: pal, num_clouds: 40 }),
            new Explosion({ size: exp_r * 1.2, palette: pal, num_clouds: 40 }),
            new Explosion({ size: exp_r * 0.6, palette: pal, num_clouds: 40,
                max_age: 0.7,}),
            new Explosion({ size: exp_r, palette: pal, num_clouds: 40 }),
            new Explosion({ size: exp_r, palette: pal, num_clouds: 40 }),
        ];
        this.explosions[0].relocate(this.x - exp_r/2, this.y, this.z - exp_r/2);
        this.explosions[1].relocate(this.x - exp_r/2, this.y - exp_r/2, this.z);
        this.explosions[2].relocate(this.x + exp_r/2, this.y, this.z);
        this.explosions[3].relocate(this.x + exp_r/2, this.y, this.z);
        this.explosions[4].relocate(this.x, this.y, this.z);

        sounds.mine_hit.play();
        this.report_self_destroyed();
    }

    report_self_destroyed() {
        spawner.report_base_destroyed(this);
    }

    destroy() {
        //then, remove this object from the list
        var obj_index = objects.indexOf(this);
        if (obj_index != -1) objects.splice(obj_index, 1);
    }

    render() {
        if (this.explosions) {
            this.explosions.forEach(expl => {
                if (expl.age < expl.max_age)
                    expl.render();
            });
        }
        if (this.explosion_min_pct < 0.5) {
            this.parts.forEach(part => {
                part.render();
            });
        }
    }

}
