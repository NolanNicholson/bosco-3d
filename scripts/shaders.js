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

var src_vs_single_color = `#version 300 es

in vec4 a_position;

uniform mat4 u_matrix_model;
uniform mat4 u_matrix_viewproj;

void main() {
    gl_Position = u_matrix_viewproj * u_matrix_model * a_position;
    gl_PointSize = 2.0f;
}
`;

var src_fs_single_color = `#version 300 es

precision mediump float;

uniform vec4 u_color;
in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = u_color;
}
`;

var src_vs_explosion = `#version 300 es

out vec4 v_color;

uniform int u_num_clouds;
uniform float u_t;
uniform vec3 u_palette[3];
uniform mat4 u_matrix_model;
uniform mat4 u_matrix_viewproj;

#define PI radians(180.0)

// hash function from https://www.shadertoy.com/view/4djSRW
// given a value between 0 and 1, returns a pseudorandom between 0 and 1
float hash(float p) {
    vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
    return fract(p2.x * p2.y * 95.4337);
}

vec3 rotate(vec4 q, vec3 v) {
    vec3 temp = cross(q.xyz, v) + q.w * v;
    return v + 2.0 * cross(q.xyz, temp);
}

void main() {
    int tri_index = gl_VertexID / 3;
    float u = float(tri_index) / float(u_num_clouds);
    float angle = hash(u) * PI * 2.0;
    float z = hash(u * 0.5) * 2.0 - 1.0;
    float radius = 1.0;
    float tri_radius = 0.4 * (1.0 - (u_t * u_t));
    vec3 triangle[3] = vec3[](
        vec3(-1, -1, 0) * tri_radius,
        vec3( 1, -1, 0) * tri_radius,
        vec3( 0,  1, 0) * tri_radius
    );

    //Prepare a quaternion representing a random rotation
    float c = cos(angle / 2.0);
    float s = sin(angle / 2.0);
    float ax_x = hash(u * 0.1);
    float ax_y = hash(u * 0.2);
    float ax_z = sqrt(1.0 - ax_x * ax_x - ax_y * ax_y);
    if (hash(u * 0.1) > 0.5) ax_x *= -1.0;
    if (hash(u * 0.2) > 0.5) ax_y *= -1.0;
    if (hash(u * 0.3) > 0.5) ax_z *= -1.0;

    vec4 q = vec4(c, ax_x * s, ax_y * s, ax_z * s);
    for (int i = 0; i < 3; i++) {
        triangle[i] = rotate(q, (triangle[i] + vec3(0.0, 0.0, 1.0))) * radius;
    }

    vec3 pos = triangle[gl_VertexID % 3];

    gl_Position = u_matrix_viewproj * u_matrix_model * vec4(pos, 1);
    gl_PointSize = 6.0f;

    float tri_0_1 = float(tri_index) / float(u_num_clouds);
    float cval = u_t * sqrt(tri_0_1) + 0.1 * hash(u * 0.7);
    int color_index = (cval > 0.5 ? 2 : (cval > 0.3 ? 1 : 0));
    v_color = vec4(u_palette[color_index], 1.0f);
}
`;

var src_fs_explosion = `#version 300 es

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
// given a value between 0 and 1, returns a pseudorandom between 0 and 1
float hash(float p) {
    vec2 p2 = fract(vec2(p * 5.3983, p * 5.4427));
    p2 += dot(p2.yx, p2.xy + vec2(21.5351, 14.3137));
    return fract(p2.x * p2.y * 95.4337);
}

void main() {
    float u = float(gl_VertexID) / float(u_num_shrapnel);
    float angle = hash(u) * PI * 2.0;
    float z = hash(hash(u)) * 2.0 - 1.0;
    float radius = 1.1;

    vec3 pos = vec3(cos(angle), sin(angle), z) * radius;
    gl_Position = u_matrix_viewproj * u_matrix_model * vec4(pos, 1);
    gl_PointSize = 3.0f;

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

out float fog_depth;

uniform mat4 u_matrix_model;
uniform mat4 u_matrix_view;
uniform mat4 u_matrix_projection;
uniform mat4 u_matrix_viewproj;

out vec2 v_texcoord;

void main() {
    vec4 view_position = u_matrix_view * u_matrix_model * a_position;
    gl_Position = u_matrix_projection * view_position;
    fog_depth = length(view_position.xyz);
    v_texcoord = a_texcoord;
}
`;

var src_fs_texture = `#version 300 es

precision mediump float;

in vec2 v_texcoord;
in float fog_depth;
uniform sampler2D u_texture;

out vec4 outColor;

void main() {

    if (fog_depth > 200.0)
        outColor = vec4(0.1, 0.2, 0.2, 1);
    else
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
//
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

// singlecolor: for objects which use a color buffer
var program_holder_single_color = new ProgramHolder(
    gl, src_vs_single_color, src_fs_single_color,
    {
        attribs: {
            positionAttributeLocation: "a_position",
        },
        uniforms: {
            uColorLoc: "u_color",
            uModelMatrixLoc: "u_matrix_model",
            uViewProjMatrixLoc: "u_matrix_viewproj",
        }
    });

//explosion: for the core "cloud" of an explosion
var program_holder_explosion = new ProgramHolder(
    gl, src_vs_explosion, src_fs_explosion,
    {
        attribs: {
        },
        uniforms: {
            uTimeLoc: "u_t",
            uNumCloudsLoc: "u_num_clouds",
            uPaletteLoc: "u_palette",
            uModelMatrixLoc: "u_matrix_model",
            uViewProjMatrixLoc: "u_matrix_viewproj",
        }
    });


//shrapnel: for flickering bits of shrapnel on the edge of an explosion
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
            uViewMatrixLoc: "u_matrix_view",
            uProjMatrixLoc: "u_matrix_projection",
        }
    });

