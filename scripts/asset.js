// Assets
// Handles loading of models and textures from external files

class Texture {
    constructor(filename) {
        //Initialize the texture with a placeholder
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        //Asynchronously load the real texture
        var image = new Image();
        image.src = filename;
        var me = this;
        image.addEventListener('load', function() {
            gl.bindTexture(gl.TEXTURE_2D, me.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                image);
            //set texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //generate mipmap
            confirm_asset_loaded();
        });
    }
}

class Model {
    constructor(obj_filename) {
        this.program_holder = program_holder_texture;

        //fetch the object file
        var me = this;
        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string);

            var positions = obj_file.vertices;
            var texcoords = obj_file.tex_vertices;
            me.load_data(positions, texcoords);
            confirm_asset_loaded();
        });

        //"base" transformation matrix:
        //the models' .obj files as-is need to be rotated and scaled
        //(note: the scale and rotation here are unique to the models
        //designed for Bosco-3D; different model production workflows
        //may require different base-transforms)
        this.base_transform = m4.identity();
        this.base_transform = m4.scale(this.base_transform,
            0.2, 0.2, 0.2);
        this.base_transform = m4.rotate_y(this.base_transform,
            Math.PI * 3 / 2);
    }

    load_data(positions, texcoords) {
        this.vao = setup_textured_object(this.program_holder,
            positions, texcoords);
        this.num_vertices = positions.length / 3;
    }

    render(model_matrix) {
        //apply model's base transformation matrix
        model_matrix = m4.multiply(model_matrix,
            this.base_transform);

        gl.useProgram(this.program_holder.program);
        gl.bindVertexArray(this.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
        gl.drawArrays(gl.TRIANGLES, 0, this.num_vertices);
    }
}

class Model_SolidColor {
    constructor(obj_filename) {
        this.program_holder = program_holder_single_color;

        //fetch the object file
        var me = this;
        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string, false);
            var positions = obj_file.vertices;
            me.load_data(positions);
            confirm_asset_loaded();
        });

        //"base" transformation matrix
        this.base_transform = m4.identity();
    }

    load_data(positions) {
        this.vao = setup_color_object(positions);
        this.num_vertices = positions.length / 3;
    }

    render(model_matrix, color) {
        //default color: bright yellow
        color = color || [1, 1, 0.5, 1];

        gl.useProgram(this.program_holder.program);
        gl.bindVertexArray(this.vao);

        // load object-specific uniforms
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
        var uColorLoc = this.program_holder.locations.uColorLoc;
        gl.uniform4f(uColorLoc, ...color);

        // draw as lines
        gl.drawArrays(gl.TRIANGLES, 0, this.num_vertices);
    }
}

class Logo {
    constructor(obj_filename) {
        this.age = 0;

        //fetch the object file
        var me = this;
        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string);
            var positions = obj_file.vertices;
            me.load_data(positions);
            confirm_asset_loaded();
        });
    }

    vao_from_2d_pos(positions) {
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

    load_data(positions) {
        // first, need to convert from 3D points to 2D points
        var logo_positions = [];
        for (var i = 0; i < positions.length; i += 3) {
            logo_positions.push(positions[i] * 0.5);
            logo_positions.push(-positions[i + 2] * 0.5);
        }
        [this.logo_vao, this.logo_nv] = this.vao_from_2d_pos(logo_positions)

        var bg_positions = [
            -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1];
        [this.bg_vao, this.bg_nv] = this.vao_from_2d_pos(bg_positions);
    }

    update(dt) {
        // (cosmetic) rotation of the player so that the stars move
        player.rotation_matrix = m4.rotate_x(
            player.rotation_matrix, Math.PI * -0.02 * dt);
        player.rotation_matrix = m4.rotate_y(
            player.rotation_matrix, Math.PI * -0.01 * dt);

        [player.x, player.y, player.z] = m4.apply_transform(
            [0, 10, 55], player.rotation_matrix);

        this.age += dt;
    }

    get_rsq(viewport) {
        var width = viewport[2]; var height = viewport[3];
        var max_r_sq = width*width + height*height;

        var progress = 1 * (this.age - 4);
        progress = Math.max(0, Math.min(progress, 1));
        return progress * progress * max_r_sq;
    }

    render() {
        var viewport = getMainViewport(gl.canvas, main_view_sizer);
        var w; var h; [w, h] = [viewport[2], viewport[3]];
        var r_sq = this.get_rsq(viewport);

        var logo_x = Math.max(0, 2 - 0.7 * this.age);
        var logo_y = Math.max(0, 0.7 * (this.age - 8));

        // prepare matrix for correcting the logo's aspect ratio
        var aspect = w / h;
        var scale = 1.05;
        var mat;
        if (aspect > 1)
            mat = m4.scaling(scale / aspect, scale * 0.9, 1);
        else
            mat = m4.scaling(scale, scale * aspect * 0.9, 1);
        mat = m4.translate(mat, logo_x, logo_y, 0);

        [program_holder_logo, program_holder_logo_inv].forEach(ph => {
            gl.useProgram(ph.program);
            gl.uniformMatrix4fv(ph.locations.uMatrixLoc, false, mat);
            gl.uniform1f(ph.locations.uRadiusSqLoc, r_sq);
            gl.uniform1f(ph.locations.uXCenterLoc, w / 2);
            gl.uniform1f(ph.locations.uYCenterLoc, h / 2 + viewport[1]);
        });

        gl.disable(gl.CULL_FACE);
        gl.useProgram(program_holder_logo.program);

        // Enable stencil writing, disable depth/color writing
        gl.stencilMask(0xff);
        gl.depthMask(false);
        gl.colorMask(false, false, false, false);

        // Draw the logo geometry to the stencil buffer as 0xff
        gl.stencilFunc(gl.ALWAYS, 0xff, 0xff);
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
        gl.bindVertexArray(this.logo_vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.logo_nv);

        // Reset the transformation matrix
        mat = m4.identity();
        [program_holder_logo, program_holder_logo_inv].forEach(ph => {
            gl.useProgram(ph.program);
            gl.uniformMatrix4fv(ph.locations.uMatrixLoc, false, mat);
        });

        // Draw a rectangle covering the whole screen as invert
        gl.useProgram(program_holder_logo_inv.program);
        gl.stencilFunc(gl.ALWAYS, 1, 0xff);
        gl.stencilOp(gl.INVERT, gl.INVERT, gl.INVERT);
        gl.bindVertexArray(this.bg_vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.bg_nv);

        // Disable stencil writing, enable depth/color writing
        gl.useProgram(program_holder_logo.program);
        gl.stencilMask(0x00);
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);

        // Draw a rectangle covering the whole screen
        // with the desired colors
        gl.stencilFunc(gl.EQUAL, 0, 0xff);

        gl.bindVertexArray(this.bg_vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.bg_nv);
        gl.flush();
        gl.enable(gl.CULL_FACE);
    }
}


class Model_Wireframe {
    constructor(obj_filename) {
        this.program_holder = program_holder_single_color;

        //fetch the object file
        var me = this;
        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string, true);

            var positions = obj_file.vertices;
            me.load_data(positions);
            confirm_asset_loaded();
        });

        //"base" transformation matrix
        this.base_transform = m4.identity();
    }

    load_data(positions) {
        this.vao = setup_color_object(positions);
        this.num_vertices = positions.length / 3;
    }

    render(model_matrix, color) {
        //default color: bright yellow
        color = color || [1, 1, 0.5, 1];

        gl.useProgram(this.program_holder.program);
        gl.bindVertexArray(this.vao);

        // load object-specific uniforms
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
        var uColorLoc = this.program_holder.locations.uColorLoc;
        gl.uniform4f(uColorLoc, ...color);

        // draw as lines
        gl.drawArrays(gl.LINES, 0, this.num_vertices);
    }
}

// Audio assets: loading and playing
var audio_context;
window.addEventListener('load', init_audio, false);

function init_audio() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audio_context = new AudioContext();
        for (const sound_name in sounds) {
            sounds[sound_name].load();
        }
    } catch(e) {
        console.error("Error: Web Audio API not supported.");
    }
}

class Sound {
    constructor(path) {
        this.loaded = false;
        this.path = path;
    }

    load() {
        var me = this;
        fetch(this.path)
        .then(response => response.arrayBuffer())
        .then((data) => {
            audio_context.decodeAudioData(data,
                buffer => {
                    this.audio_buffer = buffer;
                    me.loaded = true;
                    confirm_asset_loaded();
                }, error => {
                    console.error(error);
                }
            );
        })
    }

    play(loop = false) {
        if (this.pan_node) {
            delete this.pan_node;
        }
        if (!this.loaded) {
            console.error('Error: Attempting to play unloaded sound');
        } else {
            if (loop) {
                //looping sounds can only have one active source at a time
                this.stop();
            }
            this.source = audio_context.createBufferSource();
            this.source.loop = loop;
            this.source.buffer = this.audio_buffer;
            this.source.connect(audio_context.destination);
            this.source.start(0);
        }
    }

    pan(pan_value) {
        if (this.source) {
            if (!this.pan_node) {
                this.source.disconnect();
                this.pan_node = audio_context.createStereoPanner();
                this.source.connect(this.pan_node);
                this.pan_node.connect(audio_context.destination);
            }

            this.pan_node.pan.value = pan_value;
        }
    }

    stop() {
        if (this.source) {
            this.source.stop();
        }
    }
}

class ImageAsset {
    constructor(filename) {
        //Asynchronously load the file
        this.img = new Image();
        this.img.src = filename;
        var me = this;
        this.img.addEventListener('load', function() {
            confirm_asset_loaded();
        });
    }
}

// Load texture assets
var textures = {
    player:         new Texture("models/player_tex.png"),
    enemy_i:        new Texture("models/enemy_i_tex.png"),
    enemy_p:        new Texture("models/enemy_p_tex.png"),
    enemy_e:        new Texture("models/enemy_e_tex.png"),
    enemy_spy:      new Texture("models/enemy_spy_tex.png"),
    enemy_i_alt:    new Texture("models/enemy_i_alt_tex.png"),
    enemy_p_alt:    new Texture("models/enemy_p_alt_tex.png"),
    enemy_e_alt:    new Texture("models/enemy_e_alt_tex.png"),
    base_core_side: new Texture("models/base_core_side_tex.png"),
    base_ball:      new Texture("models/base_ball_tex.png"),
    base_ball_d:    new Texture("models/base_ball_destroyed_tex.png"),
    base_crystal:   new Texture("models/base_crystal_tex.png"),
    cosmo_mine:     new Texture("models/cosmo_mine_tex.png"),
    asteroid:       new Texture("models/asteroid_tex.png"),
}

// Load model assets
var models = {
    player:         new Model("models/player.obj"),
    enemy_i:        new Model("models/enemy_i.obj"),
    enemy_p:        new Model("models/enemy_p.obj"),
    enemy_e:        new Model("models/enemy_e.obj"),
    enemy_spy:      new Model("models/enemy_spy.obj"),
    base_core_side: new Model("models/base_core_side.obj"),
    base_core_door: new Model("models/base_core_door.obj"),
    base_ball:      new Model("models/base_ball.obj"),
    base_ball_d_c:  new Model("models/base_ball_destroyed_corner.obj"),
    base_ball_d_s:  new Model("models/base_ball_destroyed_side.obj"),
    base_arm:       new Model("models/base_arm.obj"),
    base_arm_d:     new Model("models/base_arm_destroyed.obj"),
    base_crystal:   new Model("models/base_crystal.obj"),
    cosmo_mine:     new Model("models/cosmo_mine.obj"),
    asteroid1:      new Model("models/asteroid1.obj"),
    asteroid2:      new Model("models/asteroid2.obj"),
    cube:           new Model_SolidColor("models/cube.obj"),
    logo:           new Logo("models/logo.obj"),
}

// Manual adjustments to some models
models.player.base_transform = m4.rotate_z(
    models.player.base_transform, -0.1);
models.base_core_side.base_transform = m4.translate(
    models.base_core_side.base_transform, 0, 0, 3.5);

// Load wireframe model assets
var wireframes = {
    sphere: new Model_Wireframe('models/icosphere.obj'),
    cube:   new Model_Wireframe('models/cube.obj'),
}

// Load sound assets
var sounds = {
    battle_stations:    new Sound('audio/battle-stations.wav'),
    player_drive_start: new Sound('audio/ship-drive-start.wav'),
    player_drive_loop:  new Sound('audio/ship-drive-loop.wav'),
    player_shoot:       new Sound('audio/shoot.wav'),
    player_miss:        new Sound('audio/player-miss.wav'),
    base_cannon_hit:    new Sound('audio/cannon-hit.wav'),
    blast_off:          new Sound('audio/blast-off.wav'),
    enemy_drive_loop:   new Sound('audio/enemy-drive-loop.wav'),
    e_type_hit:         new Sound('audio/e-type-hit.wav'),
    p_type_hit:         new Sound('audio/p-type-hit.wav'),
    i_type_spy_hit:     new Sound('audio/i-type-spy-hit.wav'),
    mine_hit:           new Sound('audio/boom.wav'),
    asteroid_hit:       new Sound('audio/asteroid-hit.wav'),
    alert_alert:        new Sound('audio/alert.wav'),
    formation_loop:     new Sound('audio/formation-loop.wav'),
    formation_hit:      new Sound('audio/formation-hit.wav'),
    spy_ship_sighted:   new Sound('audio/spy-ship-sighted.wav'),
    con_red_voice:      new Sound('audio/condition-red.wav'),
    con_red_loop:       new Sound('audio/condition-red-loop.wav'),
    level_win:          new Sound('audio/level-win.wav'),
};

var images = {
    hud_hiscore:        new ImageAsset('hud/hiscore.png'),
    hud_1up:            new ImageAsset('hud/1up.png'),
    text_atlas:         new ImageAsset('hud/text-atlas.png'),
    condition:          new ImageAsset('hud/condition.png'),
    con_green:          new ImageAsset('hud/condition-green.png'),
    con_yellow:         new ImageAsset('hud/condition-yellow.png'),
    con_red:            new ImageAsset('hud/condition-red.png'),
    hud_formation:      new ImageAsset('hud/formation-attack.png'),
    formation_cross:    new ImageAsset('hud/formation-cross.png'),
    formation_i:        new ImageAsset('hud/formation-i.png'),
    formation_v:        new ImageAsset('hud/formation-v.png'),
    ship:               new ImageAsset('hud/ship.png'),
};
