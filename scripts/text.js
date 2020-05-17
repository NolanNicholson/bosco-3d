// text renderer

var src_vs_text = `#version 300 es

in vec2 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix;

out vec2 v_texcoord;

void main() {
    gl_Position = u_matrix * vec4(a_position, 0.0, 1.0);
    v_texcoord = a_texcoord;
}
`;

var src_fs_text = `#version 300 es

precision mediump float;

in vec2 v_texcoord;
uniform sampler2D u_texture;
uniform vec4 u_color;

out vec4 outColor;

void main() {
    vec4 tex = texture(u_texture, v_texcoord);
    if (tex.x == 0.0) discard;
    outColor = u_color * tex;

}
`;

// texture: for objects which use a texture coordinate buffer
var program_holder_text = new ProgramHolder(
    gl, src_vs_text, src_fs_text,
    {
        attribs: {
            positionAttributeLocation: "a_position",
            texCoordAttributeLocation: "a_texcoord",
        },
        uniforms: {
            uMatrixLoc: "u_matrix",
            uColorLoc: "u_color",
        }
    });

class TextRenderer {
    constructor() {
        // program holder and VAO
        this.ph = program_holder_text;
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        //set the attributes up to receive buffer data
        var pos_loc = this.ph.locations.positionAttributeLocation;
        var st_loc = this.ph.locations.texCoordAttributeLocation;
        gl.enableVertexAttribArray(pos_loc);
        gl.enableVertexAttribArray(st_loc);

        // position buffer just contains a rectangle
        var positions = [
            0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1];
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions), gl.STATIC_DRAW);
        // point the position attribute to the position buffer
        gl.vertexAttribPointer(pos_loc,
            2 /*size*/, gl.FLOAT /*type*/, false /*normalize*/,
            0 /*stride*/, 0 /*offset*/);

        // tex coord buffer also contains a rectangle, but is dynamic
        var st = [
            0, 1, 0, 0, 1, 0, 1, 0, 1, 1, 0, 1];
        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(st), gl.STATIC_DRAW);
        // point the tex-coord attribute to the position buffer
        gl.vertexAttribPointer(st_loc,
            2 /*size*/, gl.FLOAT /*type*/, false /*normalize*/,
            0 /*stride*/, 0 /*offset*/);

        this.num_vertices = positions.length / 2;
    }

    get_tex_coords(str, index) {
        var w = 1 / 10;
        var h = 1 / 4;

        // process digits
        var cc = str.charCodeAt(index);
        if (cc >= 48 && cc <= 57) {
            var y = 0;
            var x = w * (cc - 48);
        }
        // process letters
        else if ((cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122)) {
            if (cc >= 97) cc -= 32; // to upper case
            cc -= 65;
            var y = (1 + Math.floor(cc / 10)) * h;
            var x = (cc % 10) * w;
        }

        return [ x, y, x, y+h, x+w, y+h, x+w, y+h, x+w, y, x, y ];
    }

    get_matrix(x, y) {
        var mat = m4.identity();
        mat = m4.scale(mat, 0.2, 0.2, 0.2);
        mat = m4.translate(mat, x - 5, y, 0);
        return mat;
    }

    render_char(str, ind, x, y, color) {
        // set up
        gl.bindTexture(gl.TEXTURE_2D, textures.text_atlas.texture);
        gl.useProgram(this.ph.program);
        gl.bindVertexArray(this.vao);

        // change texture coordinates
        var st = this.get_tex_coords(str, ind);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(st), 0, 0);

        // supply transformation matrix
        var mat = this.get_matrix(x, y);
        var locs = this.ph.locations;
        gl.uniformMatrix4fv(locs.uMatrixLoc, false, mat);
        gl.uniform4fv(locs.uColorLoc, color);

        // draw
        gl.drawArrays(gl.TRIANGLES, 0, this.num_vertices);
    }

    render(str, x, y, color) {
        color = color || [1, 1, 1, 1];
        for (var i = 0; i < str.length; i++) {
            this.render_char(str, i, x + i, y, color);
        }
    }
}

var text_renderer = new TextRenderer();
