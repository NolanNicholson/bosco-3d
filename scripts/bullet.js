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
    constructor(player) {
        var positions = prism(0.2, 0.2, 0.8);

        var colors = [];
        for (var i = 0; i < 36; i++) {
            colors.push(1, 1, 1);
        }
        super(positions, colors);

        this.owner = player;
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
        var dz = this.bullet_speed * dt;

        // get the new bullet position
        var new_xyz = [0, 0, -dz];
        new_xyz = m4.apply_transform(new_xyz, this.rotation_matrix);
        new_xyz = v3.plus(new_xyz, [this.x, this.y, this.z]);
        [this.x, this.y, this.z] = new_xyz;

        // update collider position to bullet's new position
        this.collider.pos = [this.x, this.y, this.z];

        //update lifetime
        this.distance += Math.abs(dz);
        if (this.distance >= this.life_distance) {
            this.deactivate();
        }

    }
}
