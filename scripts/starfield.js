function starfield(num_stars) {
    var positions = [];
    var colors = [];

    var radius = 2000;

    var white = [1, 1, 1];
    var red = [1, 0, 0];

    var x; var y; var z;
    var azimuth; var inclination;

    var hue; var chroma; var intermediate;
    var r; var g; var b;
    
    for (var i = 0; i < num_stars; i++) {
        //For positions, calculate random coordinates on a unit sphere surface
        z = (Math.random() - 0.5) * 2;
        azimuth = Math.random() * 2 * Math.PI;
        inclination = Math.acos(z);
        x = Math.sin(inclination) * Math.cos(azimuth);
        y = Math.sin(inclination) * Math.sin(azimuth);

        //For colors, calculate a random hue and interpolate that to RGB
        hue = Math.random() * 6;
        chroma = 1;
        intermediate = chroma * (1 - Math.abs(hue % 2 - 1));
        if (hue <= 1) {
            r = chroma; g = intermediate; b = 0;
        } else if (hue <= 2) {
            r = intermediate; g = chroma; b = 0;
        } else if (hue <= 3) {
            r = 0; g = chroma; b = intermediate;
        } else if (hue <= 4) {
            r = 0; g = intermediate; b = chroma;
        } else if (hue <= 5) {
            r = intermediate; g = 0; b = chroma;
        } else {
            r = chroma; g = 0; b = intermediate;
        }


        positions.push(x * radius, y * radius, z * radius);
        colors.push(r, g, b);
    }

    return [positions, colors]; 
}

class Starfield_Sub extends ObjColor {
    constructor(num_stars) {
        var pos_col = starfield(num_stars);
        super(pos_col[0], pos_col[1]);
    }

    update(dt) {
    }

    render() {
        this.model_matrix = m4.identity();
        this.model_matrix = m4.translate(this.model_matrix,
            this.x, this.y, this.z);

        gl.useProgram(this.program_holder.program);
        vao_ext.bindVertexArrayOES(this.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);
        gl.drawArrays(gl.POINTS, 0, this.num_vertices);
    }
}

class Starfield {
    constructor() {
        this.program_holder = program_holder_color;
        this.starfields = [];
        for (var i = 0; i < 4; i++) {
            this.starfields.push(new Starfield_Sub(200));
        }
        this.timer = 0;
        this.blink_interval = 0.5;
    }

    update(dt) {
        this.timer += dt;
        if (this.timer > this.blink_interval) {
            this.timer = this.timer % this.blink_interval;
            this.starfields.push(this.starfields.shift());
        }
    }

    render() {
        for (var i = 0; i < 2; i++) {
            this.starfields[i].x = this.x;
            this.starfields[i].y = this.y;
            this.starfields[i].z = this.z;
            this.starfields[i].render();
        }
    }
}
