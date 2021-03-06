function prism(w, h, d) {
    // w: width (x); h: height (y); d: depth (z)
    w /= 2; h /= 2; d /= 2;

    // vertex positions
    var v = [
        [-w, -h, -d],
        [+w, -h, -d],
        [-w, +h, -d],
        [+w, +h, -d],
        [-w, -h, +d],
        [+w, -h, +d],
        [-w, +h, +d],
        [+w, +h, +d],
    ];

    var faces = [
        [0, 1, 3, 2],
        [0, 2, 6, 4],
        [1, 5, 7, 3],
        [4, 6, 7, 5],
        [2, 3, 7, 6],
        [0, 4, 5, 1],
    ];

    var positions = [];
    faces.forEach(face => {
        positions.push(...v[face[0]]);
        positions.push(...v[face[1]]);
        positions.push(...v[face[2]]);
        positions.push(...v[face[0]]);
        positions.push(...v[face[2]]);
        positions.push(...v[face[3]]);
    });

    return positions;
}

class PlayerBullet extends ObjColor {
    constructor() {
        var positions = prism(0.2, 0.2, 0.8);
        var colors = [];
        for (var i = 0; i < 36; i++) {
            colors.push(1, 1, 1);
        }
        super(positions, colors);

        this.life_distance = 60;
        this.collider = new ColliderPoint(0, 0, 0);
        this.type = 'player_bullet';
        this.active = false;
    }

    activate() {
        this.active = true;
        all_colliders.push(this);
        this.distance = 0;
        this.bullet_speed = 100;

        [this.x, this.y, this.z] = [player.x, player.y, player.z];
        this.rotation_matrix = player.rotation_matrix;
    }

    deactivate() {
        this.active = false;
        var collider_index = all_colliders.indexOf(this);
        if (collider_index != -1) {
            all_colliders.splice(collider_index, 1);
        }
    }

    collision_event(other) {
        if (other.type != 'player') {
            this.deactivate();
        }
    }

    update(dt) {
        // advance forward and sync collider
        var dz = this.bullet_speed * dt;
        this.move(0, 0, -dz);
        this.collider.pos = [this.x, this.y, this.z];

        //update lifetime
        this.distance += Math.abs(dz);
        if (this.distance >= this.life_distance) {
            this.deactivate();
        }

    }
}

class BaseBullet extends ObjColor {
    constructor(x, y, z) {
        // set up model - a prism
        var positions = prism(0.4, 0.4, 1.6);
        var colors = [];
        for (var i = 0; i < 36; i++) {
            colors.push(1, 1, 1);
        }
        super(positions, colors);

        this.bullet_speed = 10;
        this.age = 0;
        this.rot_angle = 0;
        this.lifetime = 6;
        this.type = 'base-bullet';

        [this.x, this.y, this.z] = [x, y, z];
        var player_front = m4.apply_transform(
            [0, 0, -20], player.rotation_matrix);
        player_front = v3.plus(player_front, [player.x, player.y, player.z]);
        player_front = v3.minus([this.x, this.y, this.z], player_front);
        this.rotation_matrix = m4.lookAt(
            [0, 0, 0],
            player_front,
            [0, 1, 0]
        );

        objects.push(this);

        this.collider = new ColliderPoint(0, 0, 0);
        this.collider.group = 'base';
        all_colliders.push(this);

        //update to "push" it immediately out of the cannon's center
        this.update(0.5);
    }

    update(dt) {
        // advance forward
        this.move(0, 0, this.bullet_speed * dt);
        this.collider.pos = [this.x, this.y, this.z];

        this.rot_angle += 7 * dt;

        this.age += dt;
        if (this.age >= this.lifetime) {
            this.remove();
        }
    }

    collision_event(other) {
        this.remove();
    }

    render() {
        var old_rot_mat = this.rotation_matrix;
        this.rotation_matrix = m4.rotation_x(this.rot_angle);
        super.render();
        this.rotation_matrix = old_rot_mat;
    }
}
