class Explosion extends ObjColor {
    constructor() {
        super([], []);
        this.program_holder = program_holder_color;
        this.loaded = false;
        this.age = 0;
        this.max_age = 1;
        this.positions = [];
        this.scale = 2;
        this.max_scale = 15;
        this.palette = [[1, 1, 1], [1, 0, 0], [0, 0, 1], [0, 0, 0]];

        this.num_vertices_in_main_model;
        this.num_shrapnel = 10;
        this.shrapnel_coords = [];
        this.shrapnel_angles = [];

        //test coords - TODO: remove
        this.x = 2; this.y = 2; this.z = 2;

        this.triangle = [ [0, 0, 0.2], [-0.2, 0, 0], [0, -0.2, 0] ];

        var me = this;
        //fetch the object file
        fetch('models/icosphere.obj')
        .then(response => response.text())
        .then((obj_string) => {
            // positions come from the icosphere model
            var obj_file = loadOBJFromString(obj_string);
            me.positions = obj_file.vertices;
            me.num_vertices_in_main_model = me.positions.length / 3;
            // ...but with some extra triangles for shrapnel
            for (var i = 0; i < me.num_shrapnel; i++) {
                me.positions.push(0, 0, 0, 0, 0, 0, 0, 0, 0);
                me.shrapnel_coords.push([0, 0, 0]);
                me.shrapnel_angles.push([
                    Math.random() * Math.PI,
                    Math.random() * 2 * Math.PI,
                ]);
            }

            // colors start out as white
            var colors = [];
            for (var i = 0; i < me.positions.length / 3; i++) {
                colors.push(1, 1, 1);
            }

            // VAO set up dynamically
            var vao_and_buffers = setup_color_object(me.positions, colors,
                gl.DYNAMIC_DRAW);
            me.vao = vao_and_buffers.vao;
            me.position_buffer = vao_and_buffers.position_buffer;
            me.color_buffer = vao_and_buffers.color_buffer;
            me.num_vertices = me.positions.length / 3;
            me.loaded = true;
        });

        //"base" transformation matrix
        this.base_transform = m4.identity();
    }

    update(dt) {
        this.age += dt;
        this.scale = this.max_scale * Math.cbrt(this.age / this.max_age);
    }

    render() {
        if (this.loaded) {
            var new_colors = [];

            var color_index;
            var tri_color;
            var i = 0;
            for (var i = 0; i < this.num_vertices / 3; i++) {
                if (i > this.num_vertices_in_main_model / 3) {
                    color_index = Math.floor(
                        (this.age / this.max_age * this.palette.length)
                        - 0.5
                    );
                } else {
                    color_index = Math.floor(
                        (this.age / this.max_age * this.palette.length)
                        + ((Math.random() - 0.5) * 0.5)
                    );
                }
                color_index = Math.min(color_index, this.palette.length - 1);
                color_index = Math.max(color_index, 0);
                tri_color = this.palette[color_index];
                new_colors.push(...tri_color, ...tri_color, ...tri_color);
            }

            var shrapnel_positions = [];
            var inclination; var azimuth;
            var r_shrap = 1.1 * Math.pow(this.age / this.max_age, 0.25);
            for (var i = 0; i < this.num_shrapnel; i++) {
                inclination = this.shrapnel_angles[i][0];
                azimuth = this.shrapnel_angles[i][1];

                this.shrapnel_coords[i] = [
                    r_shrap * Math.sin(inclination) * Math.cos(azimuth),
                    r_shrap * Math.sin(inclination) * Math.sin(azimuth),
                    r_shrap * Math.cos(inclination)
                ];

                for (var j = 0; j < 3; j++) {
                    shrapnel_positions.push(
                        this.triangle[j][0] + this.shrapnel_coords[i][0],
                        this.triangle[j][1] + this.shrapnel_coords[i][1],
                        this.triangle[j][2] + this.shrapnel_coords[i][2],
                    )
                }
            }

            //update position buffer with shrapnel
            gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
            var shrapnel_offset = (this.num_vertices_in_main_model
                * 3 * Float32Array.BYTES_PER_ELEMENT);
            gl.bufferSubData(gl.ARRAY_BUFFER, shrapnel_offset,
                new Float32Array(shrapnel_positions));

            //update color buffer with everything
            gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(new_colors));

            super.render();
        }
    }
}
