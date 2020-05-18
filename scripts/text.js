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

        // screen dimensions
        this.resize();

        // custom scaling
        this.custom_scale = m4.identity();
    }

    get_tex_coords(str, index) {
        var w = 1 / 10;
        var h = 1 / 4;
        var x;
        var y;

        // process digits
        var cc = str.charCodeAt(index);
        if (cc >= 48 && cc <= 57) {
            y = 0;
            x = cc - 48;
        }
        // process letters
        else if ((cc >= 65 && cc <= 90) || (cc >= 97 && cc <= 122)) {
            if (cc >= 97) cc -= 32; // to upper case
            cc -= 65;
            y = (1 + Math.floor(cc / 10));
            x = (cc % 10);
        }
        else { //special chars
            switch(cc) {
                case 33:  x = 7; y = 3; break;  // !
                case 45:  x = 9; y = 3; break;  // -
                case 46:  x = 6; y = 3; break;  // .
                case 169: x = 8; y = 3; break;  // ©
            }
        }

        x *= w;
        y *= h;

        // hack to minimize floating-point texture coordinate errors
        x += 0.00001 * w;
        y += 0.00001 * h;
        h *= 0.999;

        return [ x, y, x, y+h, x+w, y+h, x+w, y+h, x+w, y, x, y ];
    }

    resize() {
        var viewport = getMainViewport(canvas, main_view_sizer);
        var vw = viewport[2]; var vh = viewport[3];
        var char_scale = (Math.min(vw, vh) > 360 ? 32 : 16);
        this.vw_char = vw / char_scale;
        this.vh_char = vh / char_scale;
        this.scale = m4.scaling( 1 / this.vw_char, 1 / this.vh_char, 1);
    }

    get_matrix(x, y) {
        var mat = this.scale;
        var mat = m4.multiply(mat, this.custom_scale);
        mat = m4.translate(mat, x, -y, 0);
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
        if (x == 'center') {
            x = -str.length / 2;
        }
        color = color || [1, 1, 1, 1];
        var x0 = x;
        for (var i = 0; i < str.length; i++) {
            this.render_char(str, i, x + i, y, color);
        }
    }
}

var text_renderer = new TextRenderer();
