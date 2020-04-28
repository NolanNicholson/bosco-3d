class Part extends ObjTexture {
    constructor(parent_obj, model, texture) {
        super(model, texture);
        this.rel_position = [0, 0, 0];
        this.rel_rotation = m4.identity();
        this.parent_obj = parent_obj;
        this.type = 'part';
        this.exploded = false;
        this.explosion = false;
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
                    this.model_asset = models.base_ball_d_c;
                    this.texture_asset = textures.base_ball_d_c;
            }
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
        }
    }

    sync_with_parent() {
        var p = this.parent_obj;

        //apply rotation
        this.rotation_matrix = m4.multiply(
            p.rotation_matrix, this.rel_rotation);

        this.x = p.x + this.rel_position[0];
        this.y = p.y + this.rel_position[1];
        this.z = p.z + this.rel_position[2];

        var movement_matrix = m4.identity();
        movement_matrix = m4.translate(movement_matrix, p.x, p.y, p.z);
        movement_matrix = m4.scale(movement_matrix,
            p.scale, p.scale, p.scale);
        movement_matrix = m4.multiply(movement_matrix, p.rotation_matrix);
        movement_matrix = m4.translate(movement_matrix,
            this.rel_position[0], this.rel_position[1], this.rel_position[2]);
        movement_matrix = m4.multiply(movement_matrix, this.rel_rotation);

        this.x = movement_matrix[12];
        this.y = movement_matrix[13];
        this.z = movement_matrix[14];
        this.scale = p.scale;

        if (this.collider) {
            this.collider.pos = [this.x, this.y, this.z];
        }
    }

    render() {
        if (this.explosion) {
            this.explosion.render();
        }
        super.render();
    }
}

class EnemyBase {
    constructor(models, textures) {
        this.core_sides = [
            new Part(this, models.base_core_side, textures.base_core_side),
            new Part(this, models.base_core_side, textures.base_core_side),
        ];
        this.core_sides[1].rel_rotation = m4.rotation_z(Math.PI);
        this.core_sides[0].rel_position = [ 0.5, 0, 0];
        this.core_sides[1].rel_position = [ -0.5, 0, 0];

        this.balls = []
        var ball;
        for (var i = 0; i < 6; i++) {
            ball = new Part(this, models.base_ball, textures.base_ball);
            ball.collider = new ColliderSphere(0, 0, 0, 7);
            this.balls.push(ball);
        }

        this.balls[0].rel_position = [-5, 0,  0];
        this.balls[1].rel_position = [ 5, 0,  0];
        this.balls[2].rel_position = [-2.5, 0, -4.5];
        this.balls[3].rel_position = [ 2.5, 0, -4.5];
        this.balls[4].rel_position = [-2.5, 0,  4.5];
        this.balls[5].rel_position = [ 2.5, 0,  4.5];

        [4, 5].forEach(i => {
            var ball = this.balls[i];
            ball.rel_rotation = m4.rotation_x(Math.PI);
        });

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

        this.crystal = new Part(this,
            models.base_crystal, textures.base_crystal);

        this.parts = [
            ...this.core_sides,
            ...this.balls,
            ...this.arms,
            this.crystal,
        ];

        this.rotation_matrix = m4.identity();

        this.spin_speed = 0.1;

        all_colliders.push(...this.balls);
    }

    update(dt) {
        //test rotation
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            this.spin_speed * dt);

        this.parts.forEach(part => {
            part.update(dt);
            part.sync_with_parent();
        });
    }

    render() {
        this.parts.forEach(part => {
            part.render();
        });
    }

}
