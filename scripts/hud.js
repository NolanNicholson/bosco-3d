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

const point_colors = {
    white: [1, 1, 1],
    green: [0.1, 0.9, 0],
}

class HUDPoints {
    constructor() {
        this.program_holder = program_holder_color;
        this.positions = [0, 0, 0, 0.2, 0.2, 0.2];
        this.colors = [...point_colors.white, ...point_colors.green];

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
        var ship_pos = this.normalized_loc(player.ship_obj);
        this.positions = new Float32Array(ship_pos);
        this.colors = new Float32Array([1, 1, 1]);
        this.num_vertices = 1;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.position_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.positions);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.color_buffer);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, this.colors);
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

    [
        program_holder_color,
        program_holder_single_color,
    ].forEach(ph => {
        gl.useProgram(ph.program);
        gl.uniformMatrix4fv(ph.locations.uViewProjMatrixLoc,
            false, viewproj);
    });

    //Render a cube
    //var model_matrix = m4.identity();
    var model_matrix = m4.inverse(player.rotation_matrix);
    var purple = [0.8, 0, 1, 1];
    wireframes.cube.render(model_matrix, purple);

    //Render points in the cube
    hudpoints.render(model_matrix);
}
