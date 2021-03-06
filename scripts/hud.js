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
            Math.floor(canv_hud.clientHeight / 2.5 / 64),
            Math.floor(
                (canv_hud.clientHeight - canv_hud.clientWidth) / 64),
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
        square_size = Math.min(hud_canvas.width,
            hud_canvas.height - 132);
    } else {
        //wide HUD (portrait)
        square_size = Math.min(hud_canvas.height,
            hud_canvas.width - 132);
    }

    // convert square size to the HUD canvas's client resolution
    square_size *= hud_canvas.clientWidth / hud_canvas.width;
    if (square_size < 0) square_size = 10;

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
    red:            [1, 0, 0],
    purple:         [0.7, 0, 1, 1],
    dark_purple:    [0.2, 0.1, 0.3, 1],
}

class HUDPoints {
    constructor() {
        this.program_holder = program_holder_color;

        //dummy data for initially populating the buffer
        this.positions = [];
        this.colors = [];
        var default_color = hud_colors.dark_purple.slice(0, 3);
        for (var i = 0; i < 32; i++) {
            this.positions.push(0, 0, 0);
            this.colors.push(...default_color);
        }

        // set up VAO and buffers (DYNAMIC_DRAW so we can move points around)
        var vao_and_buffers= setup_color_object(
            this.positions, this.colors, gl.DYNAMIC_DRAW);
        this.vao = vao_and_buffers.vao;
        this.position_buffer = vao_and_buffers.position_buffer;
        this.color_buffer = vao_and_buffers.color_buffer;
        this.num_vertices = 2;
    }

    reset_points() {
        this.positions = [];
        this.colors = [];
        var default_color = hud_colors.dark_purple.slice(0, 3);
        for (var i = 0; i < 32; i++) {
            this.positions.push(0, 0, 0);
            this.colors.push(...default_color);
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.positions));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.colors));
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
        var ship_pos = this.normalized_loc(player);
        this.positions.push(...ship_pos);
        var blink = Date.now() / 400 % 1 > 0.4;
        this.colors.push(...(blink ? hud_colors.white : hud_colors.black));
        this.num_vertices = 1;

        // add enemy bases
        bases.forEach(base_obj => {
            this.positions.push(...this.normalized_loc(base_obj));
            this.colors.push(...hud_colors.green);
            this.num_vertices++;
        });

        // add formation (if there is one)
        if (spawner.formation_active) {
            this.positions.push(
                ...this.normalized_loc(spawner.formation.leader));
            this.colors.push(...hud_colors.red);
            this.num_vertices++;
        }

        gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.positions));
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Float32Array(this.colors));
    }

    render(model_matrix) {
        if (game_state == 'main-game') {
            this.update_points();
        }
        gl.useProgram(this.program_holder.program);
        vao_ext.bindVertexArrayOES(this.vao);
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

function draw_letter(ctx, ch, x, y, color) {
    var letter_num = ch.toUpperCase().charCodeAt(0) - 65;
    var sx = 8 * (letter_num % 10);
    var sy = 8 * (1 + Math.floor(letter_num / 10));

    ctx.fillStyle = color || '#dedede';
    ctx.fillRect(x, y, 8, 8);
    ctx.drawImage(images.text_atlas.img,
        sx, sy, 8, 8,
        x, y, 8, 8);
}

function draw_word(ctx, word, x, y, color) {
    for (var i = 0; i < word.length; i++) {
        draw_letter(ctx, word.charAt(i), x + 8*i, y, color);
    }
}

function draw_digit(ctx, digit, x, y, color) {
    ctx.fillStyle = color || '#dedede';
    ctx.fillRect(x, y, 8, 8);
    ctx.drawImage(images.text_atlas.img,
        digit*8, 0, 8, 8,
        x, y, 8, 8);
}

function draw_number_r(ctx, num, x, y, color) {
    //Draws a right-justified number.
    //x, y denotes the coordinates of the final digit.
    drew_anything = false; // so that "0" gets drawn
    while (num > 0 || !drew_anything) {
        draw_digit(ctx, num % 10, x, y, color);
        num = Math.floor(num / 10);
        x -= 8;
        drew_anything = true;
    }
}

function draw_condition(x, y) {
    ctx_hud.clearRect(x, y, 64, 32);
    var blink = Date.now() / 250 % 1 > 0.4;
    if (spawner.formation_active) {
        if (blink) {
            ctx_hud.drawImage(images.hud_formation.img, x, y);
        }
        if (spawner.formation.hud_asset == images.formation_v) {
            ctx_hud.drawImage(spawner.formation.hud_asset.img, x, y + 16);
        } else {
            ctx_hud.drawImage(spawner.formation.hud_asset.img, x, y + 8);
        }
    } else {
        ctx_hud.drawImage(images.condition.img, x, y);
        switch (spawner.condition) {
            case 'red':
                if (blink) {
                    ctx_hud.drawImage(images.con_red.img, x, y + 12);
                }
                break;
            case 'yellow':
                ctx_hud.drawImage(images.con_yellow.img, x, y + 12);
                break;
            case 'green':
                ctx_hud.drawImage(images.con_green.img, x, y + 12);
                break;
        }
    }
}

function draw_lives(x, y, left_justified) {
    ctx_hud.clearRect(x - (!left_justified) * 64, y, 80, 16);
    var x_increment = (left_justified ? 16 : -16);
    for (var i = 0; i < lives; i++) {
        ctx_hud.drawImage(images.ship.img, x, y);
        x += x_increment;
    }
}

function draw_hud() {
    resize_hud();
    draw_minimap();
    var landscape = (canv_hud.height > canv_hud.width);

    var x_l; var x_r; var y_t; var y_b; var x_nums;

    if (landscape) {
        var halfwidth = Math.floor(canv_hud.width / 2);
        x_l = halfwidth - 32;
        x_r = halfwidth + 32;
        y_t = 4;
        y_b = canv_hud.height - 4;
        x_nums = 56 + x_l;
        if (game_state == 'main-game') draw_lives(x_l, y_b - 32, true);
        draw_word(ctx_hud, 'ROUND', x_l, y_b - 8, '#979797');
        draw_number_r(ctx_hud, round + 1, x_nums, y_b - 8, '#979797');
    } else {
        x_l = 4;
        x_r = canv_hud.width - 4;
        var halfheight = Math.floor(canv_hud.height / 2);
        y_t = halfheight - 32;
        y_b = halfheight + 32;
        x_nums = 56 + x_l;
        if (game_state == 'main-game') draw_lives(x_r - 16, y_b - 32, false);
        draw_word(ctx_hud, 'ROUND', x_r - 64, y_b - 8, '#979797');
        draw_number_r(ctx_hud, round + 1, x_r - 8, y_b - 8, '#979797');
    }

    ctx_hud.drawImage(images.hud_hiscore.img,   x_l,    y_t);
    var current_hiscore = Math.max(hi_scores.scores[0], score);
    draw_number_r(ctx_hud, current_hiscore, x_nums, y_t + 8);

    ctx_hud.drawImage(images.hud_1up.img,       x_l,    y_t + 16);
    if (game_state != 'title-screen') {
        draw_number_r(ctx_hud, score,           x_nums, y_t + 24);
    }
    draw_condition(x_l, y_t + 36);
}
