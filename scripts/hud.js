// HUD drawing script
const canv_hud = document.getElementById("ui");

function getHUDViewport(canvas, hud_canvas) {
    var square_size = Math.min(hud_canvas.clientWidth, hud_canvas.clientHeight);
    square_size *= canvas.width / canvas.clientWidth;

    var w_ratio = canvas.width / canvas.clientWidth;
    var h_ratio = canvas.height / canvas.clientHeight;

    hud_center_x = w_ratio * (canvas.clientWidth - hud_canvas.clientWidth / 2);
    hud_center_y = h_ratio * hud_canvas.clientHeight / 2;

    return [
        hud_center_x - square_size / 2,
        hud_center_y - square_size / 2,
        square_size,
        square_size,
    ];
}

function draw_hud() {
    //Reset the GL viewport to the HUD part of the screen
    var hud_view = getHUDViewport(gl.canvas, canv_hud);
    gl.viewport(...hud_view);

    // View-Proj matrix: perspective projection * inverse-camera.
    var proj_matrix = m4.perspective(
        1,
        1, // square aspect ratio
        0.1,
        2000,
    );
    var view_matrix = m4.translation(0, 0, -4);
    var viewproj = m4.multiply(proj_matrix, view_matrix);

    var ph = program_holder_single_color;
    gl.useProgram(ph.program);
    gl.uniformMatrix4fv(ph.locations.uViewProjMatrixLoc,
        false, viewproj);

    //Render a cube
    //var model_matrix = m4.identity();
    var model_matrix = m4.inverse(player.rotation_matrix);
    wireframes.cube.render(model_matrix, [0.8, 0, 1, 1]);
}
