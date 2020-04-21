const canvas = document.getElementById("c");

const gl = canvas.getContext("webgl2", {'antialias': false} );
if (!gl) {
    console.log("WebGL 2 not supported!");
}

// Enable backface culling and depth testing
gl.enable(gl.CULL_FACE);
gl.enable(gl.DEPTH_TEST);

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

// Load texture assets
var textures = {
    player:     new Texture("models/player_tex.png"),
    enemy_i:    new Texture("models/enemy_i_tex.png"),
    enemy_p:    new Texture("models/enemy_p_tex.png"),
    enemy_e:    new Texture("models/enemy_e_tex.png"),
    enemy_spy:  new Texture("models/enemy_spy_tex.png"),
    enemy_p_alt:    new Texture("models/enemy_p_alt_tex.png"),
    base_core_side: new Texture("models/base_core_side_tex.png"),
    base_ball: new Texture("models/base_ball_tex.png"),
}

// Load model assets
var models = {
    player:     new Model("models/player.obj"),
    enemy_i:    new Model("models/enemy_i.obj"),
    enemy_p:    new Model("models/enemy_p.obj"),
    enemy_e:    new Model("models/enemy_e.obj"),
    enemy_spy:  new Model("models/enemy_spy.obj"),
    base_core_side: new Model("models/base_core_side.obj"),
    base_ball: new Model("models/base_ball.obj"),
}
models.enemy_e.base_transform = m4.translate(
    models.enemy_e.base_transform,
    0, 1, 0);

// Define test objects
var obj_floor = new Floor(2, 10, 2);
var obj_starfield = new Starfield();
var player = new Player(models.player, textures.player);
player.ship_obj.x = 12;
player.ship_obj.y = 4;
player.ship_obj.z = 50;
var obj_enemy_i = new ObjTexture(models.enemy_i, textures.enemy_i);
obj_enemy_i.x = 6;
var obj_enemy_p = new ObjTexture(models.enemy_p, textures.enemy_p);
obj_enemy_p.x = 10;
var obj_enemy_e = new ObjTexture(models.enemy_e, textures.enemy_e);
obj_enemy_e.x = 14;
var obj_enemy_spy = new ObjTexture(models.enemy_spy, textures.enemy_spy);
obj_enemy_spy.x = 18;

var obj_base = new EnemyBase(models, textures);
obj_base.x = 6.5; obj_base.y = 10; obj_base.z = -10;

// Define some more test objects, in the shape of a formation
var formation = [
    new ObjTexture(models.enemy_p, textures.enemy_p_alt),
    new ObjTexture(models.enemy_p, textures.enemy_p),
    new ObjTexture(models.enemy_p, textures.enemy_p),
    new ObjTexture(models.enemy_p, textures.enemy_p),
    new ObjTexture(models.enemy_p, textures.enemy_p),
]
formation[0].x = -10; // center
formation[1].x = -10; // front
formation[2].x = -10; // back
formation[3].x = -07; // left
formation[4].x = -13; // right

formation[0].z = -10; // center
formation[1].z = -07; // front
formation[2].z = -13; // back
formation[3].z = -10; // left
formation[4].z = -10; // right

// List of objects to be updated and rendered
var objects = [obj_floor, player, obj_starfield,
    obj_enemy_i, obj_enemy_p, obj_enemy_e, obj_enemy_spy,
    obj_base,
    ...formation
];

var camera = new Camera();

var paused = false;
function pause_unpause() {
    paused = !paused;
    if (paused) {
        console.log('pause');
    }
}

function handle_keydown(e) {
    switch (e.keyCode) {
        case 80: // P key
            pause_unpause();
            break;
        default: player.handle_keydown(e);
    }
}

function handle_keyup(e) {
    player.handle_keyup(e);
}

window.addEventListener("keydown", handle_keydown);
window.addEventListener("keyup", handle_keyup);

var then = 0;
requestAnimationFrame(drawScene);

function drawScene(now) {
    now *= 0.001; // convert ms to seconds
    var dt = now - then;
    then = now;

    if (!paused) {
        // Resize the canvas and viewport
        resizeCanvasToDisplaySize(gl.canvas, 0.5);
        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

        // clear the canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        // Perspective projection matrix
        var proj_matrix = m4.perspective(
            1,
            gl.canvas.clientWidth / gl.canvas.clientHeight,
            0.1,
            2000,
        );

        objects.forEach(obj => {
            obj.update(dt);
        });

        // Camera view matrix
        var view_matrix = camera.get_view_matrix_player(player);
        camera.follow_player(dt, player);

        obj_starfield.x = camera.x;
        obj_starfield.y = camera.y;
        obj_starfield.z = camera.z;

        var viewproj = m4.multiply(proj_matrix, view_matrix);

        objects.forEach(obj => {
            gl.useProgram(obj.program_holder.program);
            gl.uniformMatrix4fv(obj.program_holder.locations.uViewProjMatrixLoc,
                false, viewproj);
            obj.render();
        });
    }

    requestAnimationFrame(drawScene);
}
