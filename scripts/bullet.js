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
        var positions = prism(1, 2, 1);

        var colors = [];
        for (var i = 0; i < 36; i++) {
            colors.push(1, 1, 1);
        }
        super(positions, colors);

        this.active = false;
    }
}

