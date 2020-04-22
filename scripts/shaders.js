const canvas = document.getElementById("c");

const gl = canvas.getContext("webgl2", {'antialias': false} );
if (!gl) {
    console.log("WebGL 2 not supported!");
}

// Enable backface culling and depth testing
gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

var src_vs_color = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix_model;
uniform mat4 u_matrix_viewproj;

out vec4 v_color;

void main() {
    gl_Position = u_matrix_viewproj * u_matrix_model * a_position;
    gl_PointSize = 2.0f;
    v_color = a_color;
}
`;

var src_fs_color = `#version 300 es

precision mediump float;

in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

var src_vs_texture = `#version 300 es

in vec4 a_position;
in vec2 a_texcoord;

uniform mat4 u_matrix_model;
uniform mat4 u_matrix_viewproj;

out vec2 v_texcoord;

void main() {
    gl_Position = u_matrix_viewproj * u_matrix_model * a_position;
    v_texcoord = a_texcoord;
}
`;

var src_fs_texture = `#version 300 es

precision mediump float;

in vec2 v_texcoord;
uniform sampler2D u_texture;

out vec4 outColor;

void main() {
    outColor = texture(u_texture, v_texcoord);
}
`;

class ProgramHolder {
    constructor(gl, vs_source, fs_source, params) {
        this.gl = gl;
        this.vs = createShader(gl, gl.VERTEX_SHADER, vs_source);
        this.fs = createShader(gl, gl.FRAGMENT_SHADER, fs_source);
        this.program = createProgram(gl, this.vs, this.fs);

        this.locations = {};

        for (const param in params.attribs) {
            this.locations[param] = gl.getAttribLocation(
                this.program, params.attribs[param]);
        }
        for (const param in params.uniforms) {
            this.locations[param] = gl.getUniformLocation(
                this.program, params.uniforms[param]);
        }
    }
}

// Define "program holders" which set up both the shaders
// and hold the location info for the shader variables.
// color: for objects which use a color buffer
var program_holder_color = new ProgramHolder(
    gl, src_vs_color, src_fs_color,
    {
        attribs: {
            positionAttributeLocation: "a_position",
            colorAttributeLocation: "a_color",
        },
        uniforms: {
            uModelMatrixLoc: "u_matrix_model",
            uViewProjMatrixLoc: "u_matrix_viewproj",
        }
    });

// texture: for objects which use a texture coordinate buffer
var program_holder_texture = new ProgramHolder(
    gl, src_vs_texture, src_fs_texture,
    {
        attribs: {
            positionAttributeLocation: "a_position",
            texCoordAttributeLocation: "a_texcoord",
        },
        uniforms: {
            uModelMatrixLoc: "u_matrix_model",
            uViewProjMatrixLoc: "u_matrix_viewproj",
        }
    });

