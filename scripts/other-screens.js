//title screen
var game_state;

function handle_keydown_title_screen(e) {
    switch(e.keyCode) {
        case 32: // Spacebar
            end_title_screen();
            break;
    }
}

class Logo {
    constructor() {
        var positions = [ 0, 0.5, -0.5, -0.3, 0.5, -0.3 ];
        this.num_vertices = positions.length / 2;

        //locations within the GL program
        var locs = program_holder_logo.locations;

        //create and bind a VAO
        this.vao = gl.createVertexArray();
        gl.bindVertexArray(this.vao);

        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions), gl.STATIC_DRAW);

        //tell WebGL which attributes will come from buffers
        gl.enableVertexAttribArray(locs.positionAttributeLocation);

        gl.vertexAttribPointer(locs.positionAttributeLocation,
            2 /*size*/, gl.FLOAT /*type*/, false /*normalize*/,
            0 /*stride*/, 0 /*offset*/);
    }

    update(dt) {
    }

    render() {
        gl.useProgram(program_holder_logo.program);
        gl.bindVertexArray(this.vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.num_vertices);
    }
}

function start_title_screen() {
    objects = [
        obj_starfield,
        new Logo(),
    ];
    game_state = 'title-screen';
    window.addEventListener("keydown", handle_keydown_title_screen);
}

function end_title_screen() {
    window.removeEventListener("keydown", handle_keydown_title_screen);
    game_state = 'main-game';
    load_level();
}
