//title screen
var game_state;

function handle_keydown_title_screen(e) {
    switch(e.keyCode) {
        case 32: // Spacebar
            end_title_screen();
            break;
    }
}

function vao_from_2d_pos(positions) {
    //create and bind a VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    //supply position data to a new buffer
    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER,
        new Float32Array(positions), gl.STATIC_DRAW);

    //set the position attribute up to receive buffer data
    var pos_loc = program_holder_logo.locations.positionAttributeLocation;
    gl.enableVertexAttribArray(pos_loc);
    gl.vertexAttribPointer(pos_loc,
        2 /*size*/, gl.FLOAT /*type*/, false /*normalize*/,
        0 /*stride*/, 0 /*offset*/);

    var num_verts = positions.length / 2;
    return [ vao, num_verts ];
}

class Logo {
    constructor() {
        var logo_positions = [ 0, 0.5, -0.5, -0.3, 0.5, -0.3 ];
        [this.logo_vao, this.logo_nv] = vao_from_2d_pos(logo_positions)

        var bg_positions = [
            -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1];
        [this.bg_vao, this.bg_nv] = vao_from_2d_pos(bg_positions)

    }

    update(dt) {
        // (cosmetic) rotation of the player so that the stars move
        player.rotation_matrix = m4.rotate_x(
            player.rotation_matrix, Math.PI * -0.02 * dt);
        player.rotation_matrix = m4.rotate_y(
            player.rotation_matrix, Math.PI * -0.01 * dt);
    }

    render() {
        gl.useProgram(program_holder_logo.program);
        gl.bindVertexArray(this.logo_vao);

        gl.stencilOp(gl.KEEP, gl.KEEP, gl.REPLACE);
        gl.stencilFunc(gl.ALWAYS, 1, 0xff);
        gl.stencilMask(0xff);
        gl.depthMask(false);
        gl.colorMask(false, false, false, false);

        gl.drawArrays(gl.TRIANGLES, 0, this.logo_nv);

        gl.bindVertexArray(this.bg_vao);

        gl.stencilFunc(gl.NOTEQUAL, 1, 0xff);
        gl.stencilMask(0x00);
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);

        gl.drawArrays(gl.TRIANGLES, 0, this.bg_nv);
        gl.flush();
    }
}

function start_title_screen() {
    objects = [
        obj_starfield,
        new Logo(),
    ];
    game_state = 'title-screen';
    window.addEventListener("keydown", handle_keydown_title_screen);

    gl.enable(gl.STENCIL_TEST);
}

function end_title_screen() {
    gl.disable(gl.STENCIL_TEST);
    window.removeEventListener("keydown", handle_keydown_title_screen);
    game_state = 'main-game';
    load_level();
}
