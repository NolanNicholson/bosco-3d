class TexturedObj3D extends Obj3D {
    constructor(program_holder, obj_filename, texture_asset) {
        super(program_holder, [], []);
        var me = this;

        //test coords - TODO: remove
        this.scale = 0.2;
        this.x = 2;
        this.y = 2;
        this.z = 2;
        this.r_vy = 0;
        this.r_y = Math.PI * 3 / 2;

        //fetch the object file
        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string);

            var positions = obj_file.vertices;
            var texcoords = obj_file.tex_vertices;
            me.load_data(me.program_holder, positions, texcoords);
        });

        this.texture_asset = texture_asset;
    }

    load_data(program_holder, positions, texcoords) {
        this.vao = setup_textured_object(program_holder, positions, texcoords);
        this.num_vertices = positions.length / 3;
    }

    update(dt) {
        this.r_y += this.r_vy * dt;
    }

    render() {
        gl.bindTexture(gl.TEXTURE_2D, this.texture_asset.texture);
        super.render();
    }
}
