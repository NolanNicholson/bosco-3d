class Part extends ObjTexture {
    constructor(parent_obj, model, texture) {
        super(model, texture);
        this.rel_position = [0, 0, 0];
        this.rel_rotation = m4.identity();
        this.parent_obj = parent_obj;
        this.type = 'part';
    }

    collision_event(other) {
        //TODO: replace
        switch(other.type) {
            case 'player_bullet':
                if (other.active) {
                    console.log(this.type, other.type);
                    this.rel_rotation =
                        m4.rotate_x(this.rel_rotation, Math.PI / 6);
                    other.active = false;
                }
                break;
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
}

class EnemyBase {
    constructor(models, textures) {
        this.program_holder = program_holder_texture;
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

        this.parts = [
            ...this.core_sides,
            ...this.balls,
            ...this.arms,
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
