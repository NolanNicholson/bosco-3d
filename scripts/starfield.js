function starfield() {
    var tilesize = 1;
    var tiles_x = 8;
    var tiles_z = 8;
    var positions = [];
    var colors = [];

    var radius = 100
    var num_stars = 200;

    var white = [1, 1, 1];
    var red = [1, 0, 0];

    var x; var y; var z;
    var azimuth; var inclination;
    
    for (var i = 0; i < num_stars; i++) {
        //calculate random coordinates on a unit sphere surface
        z = (Math.random() - 0.5) * 2;
        azimuth = Math.random() * 2 * Math.PI;
        inclination = Math.acos(z);
        console.log(z, inclination);

        x = Math.sin(inclination) * Math.cos(azimuth);
        y = Math.sin(inclination) * Math.sin(azimuth);

        positions.push(x * radius, y * radius, z * radius);
        colors.push(...white);
    }

    return [positions, colors]; 
}

class Starfield extends Obj3D {
    constructor(program_holder) {
        var pos_col = starfield();
        super(program_holder, pos_col[0], pos_col[1]);
    }

    update(dt) {
    }

    render() {
        this.model_matrix = m4.identity();
        this.model_matrix = m4.translate(this.model_matrix,
            this.x, this.y, this.z);

        gl.bindVertexArray(this.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);
        gl.drawArrays(gl.POINTS, 0, this.num_vertices);
    }
}
