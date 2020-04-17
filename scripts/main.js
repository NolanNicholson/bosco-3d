const canvas = document.getElementById("c");

const gl = canvas.getContext("webgl2");
if (!gl) {
    console.log("WebGL 2 not supported!");
}

var vertexShaderSource = `#version 300 es

in vec4 a_position;
in vec4 a_color;

uniform mat4 u_matrix_model;
uniform mat4 u_matrix_viewproj;

out vec4 v_color;

void main() {
    gl_Position = u_matrix_viewproj * u_matrix_model * a_position;
    v_color = a_color;
}
`;

var fragmentShaderSource = `#version 300 es

precision mediump float;

in vec4 v_color;
out vec4 outColor;

void main() {
    outColor = v_color;
}
`;

var vertexShader = createShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
var fragmentShader = createShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
var program = createProgram(gl, vertexShader, fragmentShader);

var positionAttributeLocation = gl.getAttribLocation(program, "a_position");
var colorAttributeLocation = gl.getAttribLocation(program, "a_color");

var uModelMatrixLoc = gl.getUniformLocation(program, "u_matrix_model");
var uViewProjMatrixLoc = gl.getUniformLocation(program, "u_matrix_viewproj");

//define test objects
var obj_floor = new Floor(2, 8, 8);
var obj_tex = new TexturedObj3D("models/enemy_i.obj");

var objects = [obj_floor, obj_tex];

var camera = new Camera();
camera.x = 2;
camera.y = 2;
camera.z = 9;

gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

function reset() {
    objects.forEach(obj => {
        obj.reset();
    });
}

function handle_keydown(e) {
    camera.handle_keydown(e);
}

function handle_keyup(e) {
    camera.handle_keyup(e);
}

reset(); // set the initial position and velocity
canvas.addEventListener("click", reset);
window.addEventListener("keydown", handle_keydown);
window.addEventListener("keyup", handle_keyup);

var then = 0;
requestAnimationFrame(drawScene);

function drawScene(now) {
    now *= 0.001; // convert ms to seconds
    var dt = now - then;
    then = now;

    //Resize the canvas and viewport
    webglUtils.resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    //clear the canvas
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    gl.useProgram(program);

    //Perspective projection matrix
    var proj_matrix = m4.perspective(
        1,
        gl.canvas.clientWidth / gl.canvas.clientHeight,
        0.1,
        2000,
    );

    //Camera view matrix
    camera.update(dt);
    var view_matrix = camera.get_view_matrix();

    var viewproj = m4.multiply(proj_matrix, view_matrix);
    gl.uniformMatrix4fv(uViewProjMatrixLoc, false, viewproj);

    objects.forEach(obj => {
        obj.update(dt);
        obj.render();
    });

    requestAnimationFrame(drawScene);
}
