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

        this.player = player;
        this.life_distance = 40;

        this.reset();
    }

    activate() {
        this.active = true;
        this.x = this.player.ship_obj.x;
        this.y = this.player.ship_obj.y;
        this.z = this.player.ship_obj.z;

        this.rotation_matrix = m4.identity();
        this.rotation_matrix = m4.multiply(this.rotation_matrix,
            this.player.rotation_matrix);
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
            this.player.pitch);
    }

    reset() {
        this.active = false;
        this.distance = 0;
        this.bullet_speed = 60;
    }

    update(dt) {
        var dz = this.bullet_speed * dt;

        //use a movement matrix to get new coordinates
        var movement_matrix = m4.identity();
        movement_matrix = m4.translate(movement_matrix,this.x, this.y, this.z);
        movement_matrix = m4.multiply(movement_matrix, this.rotation_matrix);
        movement_matrix = m4.translate(movement_matrix,
            0, 0, -dz);
        this.x = movement_matrix[12];
        this.y = movement_matrix[13];
        this.z = movement_matrix[14];

        //update lifetime
        this.distance += Math.abs(dz);
        if (this.distance >= this.life_distance) {
            this.reset();
        }

    }

    expire() {
        this.active = false;
    }
}
