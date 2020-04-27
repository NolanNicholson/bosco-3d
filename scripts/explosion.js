class Explosion extends ObjColor {
    constructor() {
        super([], []);
        this.program_holder = program_holder_color;
        this.loaded = false;
        this.age = 0;
        this.positions = [];
        this.scale = 2;

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

        var new_colors = [];
        var red = [1, 0, 0];
        var tri_color;
        for (var i = 0; i < this.positions.length / 9; i++) {
            tri_color = [Math.random(), Math.random(), Math.random()];
            new_colors.push(...tri_color, ...tri_color, ...tri_color);
        }

        //update buffers
        /*
        gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(positions),
        */

        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(new_colors));

    }
}
