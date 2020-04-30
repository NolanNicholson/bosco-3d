models.player.base_transform = m4.rotate_z(
    models.player.base_transform, -0.1);

// List of all potential colliders
var all_colliders = [];

// Define test objects
var obj_floor = new Floor(2, 10, 2);
var obj_starfield = new Starfield();
var player = new Player(models.player, textures.player);
player.ship_obj.x = 12;
player.ship_obj.y = 4;
player.ship_obj.z = 50;
var obj_enemy_i = new Enemy('i');
obj_enemy_i.x = 6;
var obj_enemy_p = new Enemy('p');
obj_enemy_p.x = 10;
var obj_enemy_e = new Enemy('e');
obj_enemy_e.x = 14;
var obj_enemy_spy = new Enemy('spy');
obj_enemy_spy.x = 18;

var obj_base = new EnemyBase(models, textures);
obj_base.x = 12; obj_base.y = -40; obj_base.z = 10;
obj_base.rotation_matrix = m4.rotation_x(Math.PI / 8);
obj_base.scale = 4;

var mines = [];
var obj_mine;
var num_mines = 12;
var theta;
for (var i = 0; i < num_mines; i++) {
    obj_mine = new CosmoMine();
    theta = i / num_mines * 2 * Math.PI;
    obj_mine.x = 40;
    obj_mine.z = Math.cos(theta) * 20;
    obj_mine.y = Math.sin(theta) * 20;
    mines.push(obj_mine);
}

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
    ...mines,
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
        default: {
            if (!paused) {
                player.handle_keydown(e);
            }
        }
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

        // update objects and resolve collisions
        objects.forEach(obj => {
            obj.update(dt);
        });
        resolve_collisions(all_colliders);

        // Update position of camera and starfield
        camera.follow_player(dt, player);
        obj_starfield.x = camera.x;
        obj_starfield.y = camera.y;
        obj_starfield.z = camera.z;

        // View-Proj matrix: perspective projection * inverse-camera.
        var proj_matrix = m4.perspective(
            1,
            gl.canvas.clientWidth / gl.canvas.clientHeight,
            0.1,
            2000,
        );
        var view_matrix = camera.get_view_matrix_player(player);
        var viewproj = m4.multiply(proj_matrix, view_matrix);

        // Populate the relevant program holders with the view-proj matrix
        [
            program_holder_color,
            program_holder_texture,
            program_holder_explosion,
            program_holder_shrapnel,
        ].forEach(ph => {
            gl.useProgram(ph.program);
            gl.uniformMatrix4fv(ph.locations.uViewProjMatrixLoc,
                false, viewproj);
        });

        // Render each object
        objects.forEach(obj => {
            obj.render();
        });

        // Render colliders, if desired
        if (RENDER_COLLIDERS) {
            all_colliders.forEach(coll => {
                render_collider(coll.collider);
            });
        }
    }

    requestAnimationFrame(drawScene);
}

/*
window.setTimeout(function() {
    console.log("BLAST OFF");
    sounds.blast_off.play();
}, 200);
*/

