const canvas = document.getElementById("c");

const gl = canvas.getContext("webgl2", {'antialias': false} );
if (!gl) {
    console.log("WebGL 2 not supported!");
}

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

//define test objects
//var obj_floor = new Floor(2, 8, 8);
var obj_tex = new TexturedObj3D(
    program_holder_texture,
    "models/enemy_i.obj", "models/enemy_i_tex.png");

//var objects = [obj_floor, obj_tex];
var objects = [obj_tex];

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

    objects.forEach(obj => {
        gl.useProgram(obj.program_holder.program);
        gl.uniformMatrix4fv(obj.program_holder.locations.uViewProjMatrixLoc,
            false, viewproj);
        obj.update(dt);
        obj.render();
    });

    requestAnimationFrame(drawScene);
}
