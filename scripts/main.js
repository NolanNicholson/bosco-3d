const PLAYER_VIEW_DISTANCE = 300;
const PLAYER_VIEW_DIST_SQ = PLAYER_VIEW_DISTANCE * PLAYER_VIEW_DISTANCE;

// Score
var hiscore = 20000;
var score = 0;
var lives = 3;
var round = 0;

var spawner = new RandomEnemySpawner();
var camera = new Camera();
var viewproj;

var paused = false;
function pause_unpause() {
    paused = !paused;
    if (paused) {
        console.log('pause');
        audio_context.suspend();
    } else {
        console.log('unpause');
        audio_context.resume();
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

function finish_loading() {
    gl.disable(gl.SCISSOR_TEST);
    then = 0;
    title_screen.start();
    requestAnimationFrame(drawScene);
}

var assets_loaded = 0;
var total_assets =
    Object.keys(textures).length +
    Object.keys(models).length +
    Object.keys(wireframes).length +
    Object.keys(sounds).length +
    Object.keys(images).length;

function confirm_asset_loaded() {
    assets_loaded++;
    if (assets_loaded == total_assets) {
        console.log("Assets loaded");
        finish_loading();
    }
}

// frame counting
var then;
var dt;
function tick(now) {
    now *= 0.001; // convert ms to seconds
    dt = Math.min(now - then, 0.5); // min so it doesn't jump huge amounts
    then = now;
}

function drawLoadingScreen(now) {
    tick(now);

    // Resize the canvas and viewport
    resizeCanvasToDisplaySize(gl.canvas);
    gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);

    // clear the canvas
    gl.clearColor(0, 0, 0, 1);
    gl.scissor(0, 0, gl.canvas.width, gl.canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // draw a loading bar using SCISSOR_TEST
    var bar_height = gl.canvas.height * 0.1;
    var bar_width = gl.canvas.width * assets_loaded / total_assets;
    gl.scissor(0, 0, bar_width, bar_height);
    gl.clearColor(1, 1, 1, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // queue up next frame, unless loading is done
    if (assets_loaded < total_assets) {
        requestAnimationFrame(drawLoadingScreen);
    }
}

gl.enable(gl.SCISSOR_TEST);
requestAnimationFrame(drawLoadingScreen);

function drawScene(now) {
    tick(now);

    if (!paused) {
        // Resize the canvas and viewport
        resizeCanvasToDisplaySize(gl.canvas);
        gl.viewport(...getMainViewport(gl.canvas, main_view_sizer));

        // clear the canvas
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        var dt_round;
        if (player.state != 'driving') dt_round = dt;
        else dt_round = dt * (1 + (Math.min(round, 10) * 0.03));

        // potentially add an enemy
        spawner.update(dt_round);

        // update objects and resolve collisions
        objects.forEach(obj => {
            obj.update(dt_round);
        });
        resolve_collisions(all_colliders);

        // Update position of camera and starfield
        camera.follow_player(player);
        obj_starfield.x = camera.x;
        obj_starfield.y = camera.y;
        obj_starfield.z = camera.z;

        // View-Proj matrix: perspective projection * inverse-camera.
        var proj_matrix = m4.perspective(
            1,
            main_view_sizer.clientWidth / main_view_sizer.clientHeight,
            0.1,
            2000,
        );
        var view_matrix = camera.get_view_matrix_player(player);
        viewproj = m4.multiply(proj_matrix, view_matrix);

        // Populate the relevant program holders with the view-proj matrix
        [
            program_holder_color,
            program_holder_single_color,
            program_holder_texture,
            program_holder_explosion,
            program_holder_shrapnel,
        ].forEach(ph => {
            gl.useProgram(ph.program);
            gl.uniformMatrix4fv(ph.locations.uViewProjMatrixLoc,
                false, viewproj);
        });

        // The texture program also needs the
        // view and projection matrices, individually
        gl.useProgram(program_holder_texture.program);
        gl.uniformMatrix4fv(program_holder_texture.locations.uViewMatrixLoc,
            false, view_matrix);
        gl.uniformMatrix4fv(program_holder_texture.locations.uProjMatrixLoc,
            false, proj_matrix);

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

        // Draw HUD
        draw_hud();
    }

    requestAnimationFrame(drawScene);
}
