class Part extends ObjTexture {
    constructor(parent_obj, model, texture) {
        super(model, texture);
        this.rel_position = [0, 0, 0];
        this.rel_rotation = m4.identity();
        this.parent_obj = parent_obj;
    }

    sync_with_parent() {
        this.x = this.parent_obj.x + this.rel_position[0];
        this.y = this.parent_obj.y + this.rel_position[1];
        this.z = this.parent_obj.z + this.rel_position[2];
    }
}

class EnemyBase {
    constructor(models, textures) {
        this.program_holder = program_holder_texture;
        this.core_sides = [
            new Part(this, models.base_core_side, textures.base_core_side),
            new Part(this, models.base_core_side, textures.base_core_side),
        ];
        this.core_sides[1].rotation_matrix = m4.rotate_z(
            this.core_sides[1].rotation_matrix,Math.PI);
        this.core_sides[1].rel_position = [0, 0, 0];
        this.core_sides[1].rel_position = [-0.5, 0, 0];

        this.balls = []
        for (var i = 0; i < 6; i++) {
            this.balls.push(new Part(this,
                models.base_ball, textures.base_ball));
            this.balls[i].rotation_matrix = m4.rotate_z(
                this.balls[i].rotation_matrix, Math.PI);
        }
        this.balls[0].rel_position = [-5, 0,  0];
        this.balls[1].rel_position = [ 5, 0,  0];
        this.balls[2].rel_position = [-2, 0, -5];
        this.balls[3].rel_position = [ 2, 0, -5];
        this.balls[4].rel_position = [-2, 0,  5];
        this.balls[5].rel_position = [ 2, 0,  5];

        this.parts = [
            ...this.core_sides,
            ...this.balls,
        ];
    }

    update(dt) {
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
