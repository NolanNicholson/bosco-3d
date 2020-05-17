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

out vec4 outColor;

void main() {
    outColor = texture(u_texture, v_texcoord);
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
            -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1];
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

    render() {
        gl.bindTexture(gl.TEXTURE_2D, textures.text_atlas.texture);
        gl.useProgram(this.ph.program);
        gl.bindVertexArray(this.vao);
        var uMatrixLoc = this.ph.locations.uMatrixLoc;
        gl.uniformMatrix4fv(uMatrixLoc, false, m4.identity());
        gl.drawArrays(gl.TRIANGLES, 0, this.num_vertices);
    }
}

var text_renderer = new TextRenderer();
