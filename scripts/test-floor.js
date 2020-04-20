function checkered_floor(tilesize, tiles_x, tiles_z) {
    var positions = [];
    var colors = [];

    var light_gray = [0.8, 0.8, 0.8];
    var dark_gray = [0.5, 0.5, 0.5];

    var this_color;
    var x1, z1, x2, z2;

    for (var x_i = 0; x_i < tiles_x; x_i++) {
        for (var z_i = 0; z_i < tiles_z; z_i++) {
            x1 = tilesize * x_i;
            x2 = tilesize * (x_i + 1);
            z1 = tilesize * z_i;
            z2 = tilesize * (z_i + 1);

            positions.push(
                x1, 0, z1,
                x1, 0, z2,
                x2, 0, z1,
                x2, 0, z1,
                x1, 0, z2,
                x2, 0, z2,
            );

            if ((x_i - z_i) % 2) {
                this_color = light_gray;
            } else {
                this_color = dark_gray;
            }

            for (var i = 0; i < 6; i++) {
                colors.push(this_color);
            }
        }
    }

    return [positions, colors.flat()];
}

class Floor extends ObjColor {
    constructor(tilesize, tiles_x, tiles_z) {
        var pos_col = checkered_floor(tilesize, tiles_x, tiles_z);
        super(pos_col[0], pos_col[1]);
    }

    update(dt) {
    }
}
