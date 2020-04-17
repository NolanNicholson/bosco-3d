class TexturedObj3D extends Obj3D {
    constructor(obj_filename, tex_filename) {
        super([], []);
        var me = this;

        //test coords - TODO: remove
        this.scale = 0.2;
        this.x = 2;
        this.y = 2;
        this.z = 2;

        //fetch the object file
        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string);
            console.log(obj_file);

            var positions = obj_file.vertices;
            var texcoords = obj_file.tex_vertices;
            me.load_data(positions, texcoords);
        });

        //Initialize the texture with a placeholder
        var texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        //Asynchronously load the real texture
        var image = new Image();
        image.src = tex_filename;
        image.addEventListener('load', function() {
            gl.bindTexture(gl.TEXTURE_2D, texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                image);
            //set texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //generate mipmap
            gl.generateMipmap(gl.TEXTURE_2D);
        });
    }

    load_data(positions, texcoords) {
        this.vao = setup_textured_object(positions, texcoords);
        this.num_vertices = positions.length / 3;
    }

    update(dt) {
    }
}
