class Part extends ObjTexture {
    constructor(parent_obj, model, texture) {
        super(model, texture);
        this.rel_position = [0, 0, 0];
        this.rel_rotation = m4.identity();
        this.parent_obj = parent_obj;
        this.type = 'part';
    }

    update(dt) {
        super.update(dt);
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

        this.spawn_missile_timer = 0;
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
        new_enemy.ai_mode = 'dodge-me';
        new_enemy.collider.group = 'base';
        new_enemy.drive_speed *= 2;

        var rot = this.rotation_matrix;
        rot = m4.rotate_x(rot, -Math.PI / 2 * y_sign);
        new_enemy.rotation_matrix = rot;

        [new_enemy.x, new_enemy.y, new_enemy.z] = [this.x, this.y, this.z];
        objects.push(new_enemy);
        this.spawn_missile_timer = 1.5;
    }

    spawn_missile_check(dt) {
        // minimum delay between missile launches
        if (this.spawn_missile_timer > 0) {
            this.spawn_missile_timer -= dt;
            return;
        } else {
            var rel_to_player = this.get_rel_to_player();
            // quit if the player is too far away
            if (v3.len_sq(rel_to_player) > 3000) return;

            var inv_rot = m4.inverse(this.rotation_matrix);
            var rel_coord = m4.apply_transform(rel_to_player, inv_rot);
            // quit if the player is off to either side
            if (Math.abs(rel_coord[0]) > 4 * this.scale) return;
            if (Math.abs(rel_coord[2]) > 4 * this.scale) return;
            this.spawn_missile(Math.sign(rel_coord[1]));
        }
    }

    update(dt) {
        super.update(dt);
        this.rel_rotation = m4.rotate_x(this.rel_rotation,
            this.rotation_speed * dt);
        this.rotation_matrix = m4.multiply(this.rel_rotation,
            this.parent_obj.rotation_matrix);
        this.spawn_missile_check(dt);
    }

    collision_event(other) {
        //none - the door is impervious
    }
}

class BaseCannon extends Part {
    constructor(parent_obj) {
        super(parent_obj, models.base_ball, textures.base_ball);
        this.exploded = false;
        this.explosion = false;
        this.is_corner = true;
        this.type = 'base_cannon';

        this.shoot_timer = 0;
    }

    collision_event(other) {
        if (!this.exploded) {
            switch(other.type) {
                case 'player_bullet':
                    sounds.base_cannon_hit.play();
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

                    //communicate damage to the main base
                    this.parent_obj.damage();
            }
        }
    }

    update_cannon(dt) {
        this.shoot_timer -= dt;
        if (this.shoot_timer <= 0) {
            this.shoot_timer = Math.random() * 1.5 + 0.5;

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
    }

    render() {
        if (this.explosion) {
            this.explosion.render();
        }
        super.render();
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
        //none - the core sides are impervious
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
        var ball;
        for (var i = 0; i < 6; i++) {
            ball = new BaseCannon(this);
            ball.collider = new ColliderSphere(0, 0, 0, 7);
            ball.collider.group = 'base';
            this.balls.push(ball);
        }
        this.balls[0].rel_position = [-5, 0,  0];
        this.balls[1].rel_position = [ 5, 0,  0];
        this.balls[2].rel_position = [-2.5, 0, -4.5];
        this.balls[3].rel_position = [ 2.5, 0, -4.5];
        this.balls[4].rel_position = [-2.5, 0,  4.5];
        this.balls[5].rel_position = [ 2.5, 0,  4.5];
        this.balls[0].is_corner = false;
        this.balls[1].is_corner = false;
        this.balls[0].rel_rotation = m4.rotation_z(Math.PI);

        // some of the base cannons need to be rotated
        [4, 5].forEach(i => {
            this.balls[i].rel_rotation = m4.rotation_x(Math.PI);
        });
        [2, 4].forEach(i => {
            this.balls[i].rel_rotation = m4.rotate_z(
                this.balls[i].rel_rotation, Math.PI);
        });

        // set up the "arms" that connect the cannons
        this.arms = []
        for (var i = 0; i < 4; i++) {
            this.arms.push(new Part(this,
                models.base_arm, textures.base_core_side));
        }
        this.arms[0].rel_position = [4, 0, -2];
        this.arms[1].rel_position = [4, 0, 2];
        this.arms[2].rel_position = [-4, 0, -2];
        this.arms[3].rel_position = [-4, 0, 2];
        this.arms[1].rel_rotation = m4.rotation_x(Math.PI);
        this.arms[2].rel_rotation = m4.rotation_x(Math.PI);

        // set up the core crystal
        this.crystal = new BaseCrystal(this);

        this.crystal_guard = new BaseCoreDoor(this);

        this.parts = [
            ...this.core_sides,
            ...this.balls,
            ...this.arms,
            this.crystal,
            this.crystal_guard,
        ];

        this.rotation_matrix = m4.identity();

        this.spin_speed = 0.1;

        this.colliders = [...this.balls, this.crystal,
            ...this.core_sides,
            this.crystal_guard];
        all_colliders.push(...this.colliders);

        this.explosions = false;
        this.explosion_min_pct = 0;
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
