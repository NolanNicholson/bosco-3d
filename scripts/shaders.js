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

var src_vs_shrapnel = `#version 300 es

out vec4 v_color;

uniform int u_num_shrapnel;
uniform float u_t;
uniform vec3 u_palette[3];
uniform mat4 u_matrix_model;
uniform mat4 u_matrix_viewproj;

#define PI radians(180.0)

// hash function from https://www.shadertoy.com/view/4djSRW
// given a value between 0 and 1
// returns a value between 0 and 1 that *appears* kind of random
float hash(float p) {
    vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
    return fract(p2.x * p2.y * 95.4337);
}

void main() {
    float u = float(gl_VertexID) / float(u_num_shrapnel);
    float angle = hash(u) * PI * 2.0;
    float z = hash(hash(u)) * 2.0 - 1.0;
    float radius = 0.8;

    vec3 pos = vec3(cos(angle), sin(angle), z) * radius;
    gl_Position = u_matrix_viewproj * u_matrix_model * vec4(pos, 1);
    gl_PointSize = 2.0f;

    int color_index = int((sqrt(u_t) * hash(u_t * u)) * 3.0);
    v_color = vec4(u_palette[color_index], 1.0f);
}
`;

var src_fs_shrapnel = `#version 300 es

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

var program_holder_shrapnel = new ProgramHolder(
    gl, src_vs_shrapnel, src_fs_shrapnel,
    {
        attribs: {
        },
        uniforms: {
            uTimeLoc: "u_t",
            uNumShrapnelLoc: "u_num_shrapnel",
            uPaletteLoc: "u_palette",
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

