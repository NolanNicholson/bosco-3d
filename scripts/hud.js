// HUD drawing script
const canv_hud = document.getElementById("ui");

function getHUDViewport(canvas, hud_canvas) {
    var w_ratio = canvas.width / canvas.clientWidth;
    var h_ratio = canvas.height / canvas.clientHeight;
    return [
        w_ratio * (canvas.clientWidth - hud_canvas.clientWidth),
        0,
        w_ratio * hud_canvas.clientWidth,
        h_ratio * hud_canvas.clientHeight,
    ];
}

function draw_hud() {
    //Reset the GL viewport to the HUD part of the screen
    var hud_view = getHUDViewport(gl.canvas, canv_hud);
    gl.viewport(...hud_view);
}
