// HUD drawing script

// HUD canvas and context
const canv_hud = document.getElementById("hud-landscape");
const ctx_hud = canv_hud.getContext("2d");

//An element that determines the size of the main 3D view.
//This can't just be the canvas itself, because the HUD on the side also
//has at least one 3D element, so the main canvas needs to extend to that space
const main_view_sizer = document.getElementById("main-screen-landscape");

function resize_hud() {
    // first, get the multiplier
    var pixel_ratio;
    if (canv_hud.clientWidth < canv_hud.clientHeight) {
        //tall HUD (landscape)
        pixel_ratio = Math.min(
            Math.floor(canv_hud.clientWidth / 64),
            Math.floor((canv_hud.clientHeight - canv_hud.clientWidth) / 80),
        );
    } else {
        //wide HUD (portrait)
        pixel_ratio = Math.floor(canv_hud.clientHeight / 60);
    }
    pixel_ratio = Math.max(pixel_ratio, 1);

    const dpr = window.devicePixelRatio;
    const width  = canv_hud.clientWidth  * dpr / pixel_ratio | 0;
    const height = canv_hud.clientHeight * dpr / pixel_ratio | 0;
    if (canv_hud.width !== width ||  canv_hud.height !== height) {
        // update dimensions
        canv_hud.width  = width;
        canv_hud.height = height;
        return true;
    }
    return false;
}

function getHUDViewport(canvas, hud_canvas) {

    // determine size of minimap square
    // based on expected size of other HUD elements
    var square_size;
    if (hud_canvas.clientWidth < hud_canvas.clientHeight) {
        //tall HUD (landscape)
        square_size = Math.min(hud_canvas.clientWidth,
            hud_canvas.clientHeight - 160);
    } else {
        //wide HUD (portrait)
        square_size = Math.min(hud_canvas.clientHeight,
            hud_canvas.clientWidth - 160);
    }

    // apply 3D canvas's pixel ratio to this square
    var pixel_ratio = canvas.width / canvas.clientWidth;
    square_size *= pixel_ratio;

    var hud_center_x = pixel_ratio *
        (canvas.clientWidth - hud_canvas.clientWidth / 2);
    var hud_center_y = pixel_ratio * hud_canvas.clientHeight / 2;

    return [
        hud_center_x - square_size / 2,
        hud_center_y - square_size / 2,
        square_size,
        square_size,
    ];
}

const hud_colors = {
    white:          [1, 1, 1],
    black:          [0, 0, 0],
    green:          [0.1, 0.9, 0],
    purple:         [0.7, 0, 1, 1],
    dark_purple:    [0.2, 0.1, 0.3, 1],
}

class HUDPoints {
    constructor() {
        this.program_holder = program_holder_color;

        //dummy data for initially populating the buffer
        var num_points = 64;
        this.positions = [];
        this.colors = [];
        for (var i = 0; i < 32; i++) {
            this.positions.push(0, 0, 0);
            this.colors.push(0, 0, 0);
        }

        // set up VAO and buffers (DYNAMIC_DRAW so we can move points around)
        var vao_and_buffers= setup_color_object(
            this.positions, this.colors, gl.DYNAMIC_DRAW);
        this.vao = vao_and_buffers.vao;
        this.position_buffer = vao_and_buffers.position_buffer;
        this.color_buffer = vao_and_buffers.color_buffer;
        this.num_vertices = 2;
    }

    normalized_loc(obj) {
        var xspan = level_bounds.x.max - level_bounds.x.min;
        var yspan = level_bounds.y.max - level_bounds.y.min;
        var zspan = level_bounds.z.max - level_bounds.z.min;
        return [
            ((obj.x - level_bounds.x.min) / xspan * 2) - 1,
            ((obj.y - level_bounds.y.min) / yspan * 2) - 1,
            ((obj.z - level_bounds.z.min) / zspan * 2) - 1,
        ];
    }

    update_points() {
        this.positions = [];
        this.colors = [];

        // add player (light blinks black/white)
        var ship_pos = this.normalized_loc(player.ship_obj);
        this.positions.push(...ship_pos);
        var blink = Date.now() / 400 % 1 > 0.4;
        this.colors.push(...(blink ? hud_colors.white : hud_colors.black));
        this.num_vertices = 1;

        // add enemy bases
        bases.forEach(base_obj => {
            if (!base_obj.explosions) {
                this.positions.push(...this.normalized_loc(base_obj));
                this.colors.push(...hud_colors.green);
                this.num_vertices++;
            }
        });

        gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.positions));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.colors));
    }

    render(model_matrix) {
        this.update_points();
        gl.useProgram(this.program_holder.program);
        gl.bindVertexArray(this.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
        gl.drawArrays(gl.POINTS, 0, this.num_vertices);
    }
}
var hudpoints = new HUDPoints();

function draw_minimap() {
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

    [
        program_holder_color,
        program_holder_single_color,
    ].forEach(ph => {
        gl.useProgram(ph.program);
        gl.uniformMatrix4fv(ph.locations.uViewProjMatrixLoc,
            false, viewproj);
    });

    //Rotation is the inverse of the player's
    var model_matrix = m4.inverse(player.rotation_matrix);

    //Render a solid cube AND a wireframe
    //(DEPTH_TEST needs to be off so the solid cube doesn't block everything)
    gl.disable(gl.DEPTH_TEST);
    models.cube.render(model_matrix, hud_colors.dark_purple);
    gl.enable(gl.DEPTH_TEST);
    wireframes.cube.render(model_matrix, hud_colors.purple);

    //Render points in the cube
    hudpoints.render(model_matrix);
}

const digits = [
    images.hud_0, images.hud_1,
    images.hud_2, images.hud_3,
    images.hud_4, images.hud_5,
    images.hud_6, images.hud_7,
    images.hud_8, images.hud_9,
];
function draw_digit(ctx, digit, x, y) {
    ctx.drawImage(digits[digit].img, x, y);
}

function draw_number_r(ctx, num, x, y) {
    //Draws a right-justified number.
    //x, y denotes the coordinates of the final digit.
    drew_anything = false; // so that "0" gets drawn
    while (num > 0 || !drew_anything) {
        draw_digit(ctx, num % 10, x, y);
        num = Math.floor(num / 10);
        x -= 8;
        drew_anything = true;
    }
}

function draw_condition(x, y) {
    ctx_hud.drawImage(images.condition.img, x, y);
    ctx_hud.drawImage(images.con_green.img, x, y + 12);
}

function draw_lives(x, y, left_justified) {
    ctx_hud.clearRect(0, y, canv_hud.width, 16);
    var x_increment = (left_justified ? 16 : -16);
    for (var i = 0; i < lives; i++) {
        ctx_hud.drawImage(images.ship.img, x, y);
        x += x_increment;
    }
}

function draw_hud() {
    resize_hud();
    draw_minimap();

    var x_l = 4;
    var x_r = canv_hud.width - 4;
    var y_t = 4;
    var y_b = canv_hud.height - 4;

    var x_nums = 56 + x_l;
    ctx_hud.drawImage(images.hud_hiscore.img,   x_l,    y_t);
    draw_number_r(ctx_hud, hiscore,             x_nums, y_t + 8);
    ctx_hud.drawImage(images.hud_1up.img,       x_l,    y_t + 16);
    draw_number_r(ctx_hud, score,               x_nums, y_t + 24);
    draw_condition(x_l, y_t + 36);

    if (canv_hud.height > canv_hud.width) { // landscape 
        draw_lives(x_l, y_b - 32, true);
    } else { // portrait
        draw_lives(x_r - 16, y_b - 32, false);
    }
}
