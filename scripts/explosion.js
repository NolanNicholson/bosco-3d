class Explosion extends ObjColor {
    constructor() {
        super([], []);
        this.program_holder = program_holder_color;
        this.loaded = false;
        this.age = 0;
        this.max_age = 1;
        this.positions = [];
        this.scale = 2;
        this.palette = [[1, 1, 1], [1, 0, 0], [0, 0, 1], [0, 0, 0]];

        //test coords - TODO: remove
        this.x = 2; this.y = 2; this.z = 2;

        var me = this;
        //fetch the object file
        fetch('models/icosphere.obj')
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string);

            me.positions = obj_file.vertices;
            var colors = [];
            for (var i = 0; i < me.positions.length / 3; i++) {
                colors.push(1, 1, 1);
            }
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
        this.age %= this.max_age;
        this.scale = 4 * (this.age + 0.25);
    }

    render() {
        if (this.loaded) {
            var new_colors = [];

            var color_index;
            var tri_color;
            for (var i = 0; i < this.positions.length / 9; i++) {

                color_index = Math.floor(
                    (this.age / this.max_age * this.palette.length)
                    + ((Math.random() - 0.5) * 0.5)
                );
                color_index = Math.min(color_index, this.palette.length - 1);
                color_index = Math.max(color_index, 0);
                tri_color = this.palette[color_index];
                new_colors.push(...tri_color, ...tri_color, ...tri_color);
            }

            //update buffers
            /*
            gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(positions),
            */
            gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
            gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(new_colors));

            super.render();
        }
    }
}
