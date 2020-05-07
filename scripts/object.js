function setup_color_object(positions, colors, draw_type) {
    colors = colors || [];
    draw_type = draw_type || gl.STATIC_DRAW;

    //locations within the GL program
    var locs;
    if (colors.length) {
        locs = program_holder_color.locations;
    } else {
        locs = program_holder_single_color.locations;
    }

    //create and bind a VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var num_vertices = positions.length / 3;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), draw_type);

    //tell WebGL which attributes will come from buffers
    gl.enableVertexAttribArray(locs.positionAttributeLocation);

    var size = 3;          // 3 values per step
    var type = gl.FLOAT;   // data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each step
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(locs.positionAttributeLocation,
        size, type, normalize, stride, offset);

    //only build a color buffer if we have color data
    var colorBuffer;
    if (colors.length) {
        gl.enableVertexAttribArray(locs.colorAttributeLocation);
        colorBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), draw_type);

        //All of the previous params for gl.vertexAttribPointer
        //are still correct.
        gl.vertexAttribPointer(locs.colorAttributeLocation,
            size, type, normalize, stride, offset);
    }

    if (draw_type == gl.STATIC_DRAW) {
        return vao;
    } else {
        return {
            vao: vao,
            position_buffer: positionBuffer,
            color_buffer: colorBuffer,
        };
    }
}

function setup_textured_object(program_holder, positions, texcoords) {
    //create and bind a VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var num_vertices = positions.length / 3;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    //tell WebGL which attributes will come
    //from a buffer, not a constant value
    gl.enableVertexAttribArray(
        program_holder.locations.positionAttributeLocation);
    gl.enableVertexAttribArray(
        program_holder.locations.texCoordAttributeLocation);

    var size = 3;          // 3 values per step
    var type = gl.FLOAT;   // data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each step
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        program_holder.locations.positionAttributeLocation,
        size, type, normalize, stride, offset);

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    //Most of the previous calls to gl.vertexAttribPointer are still good -
    //we just have to update the size since each vertex has only 2 tex coords
    size = 2;
    gl.vertexAttribPointer(
        program_holder.locations.texCoordAttributeLocation,
        size, type, normalize, stride, offset);

    return vao;
}

class ObjBase {
    constructor() {
        this.x = 0; this.y = 0; this.z = 0;
        this.r_vx = 0; this.r_vy = 0; this.r_vz = 0;
        this.scale = 1;
        this.model_matrix = m4.identity();
        this.rotation_matrix = m4.identity();
    }

    update(dt) {
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix, this.r_vx * dt);
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix, this.r_vy * dt);
        this.rotation_matrix = m4.rotate_z(this.rotation_matrix, this.r_vz * dt);
    }

    bounds_check() {
        var bounds = level_bounds;

        if (this.x > bounds.x.max)
            this.x -= (bounds.x.max - bounds.x.min);
        if (this.x < bounds.x.min)
            this.x += (bounds.x.max - bounds.x.min);

        if (this.y > bounds.y.max)
            this.y -= (bounds.y.max - bounds.y.min);
        if (this.y < bounds.y.min)
            this.y += (bounds.y.max - bounds.y.min);

        if (this.z > bounds.z.max)
            this.z -= (bounds.z.max - bounds.z.min);
        if (this.z < bounds.z.min)
            this.z += (bounds.z.max - bounds.z.min);
    }

    prep_model_matrix() {
        this.model_matrix = m4.identity();


        var render_x = this.x;
        var render_y = this.y;
        var render_z = this.z;

        var pl = player.ship_obj;
        if ((pl.x + PLAYER_VIEW_DISTANCE > level_bounds.x.max)
            && (this.x < pl.x - PLAYER_VIEW_DISTANCE)
        ) {
            render_x += (level_bounds.x.max - level_bounds.x.min);
        }
        if ((pl.y + PLAYER_VIEW_DISTANCE > level_bounds.y.max)
            && (this.y < pl.y - PLAYER_VIEW_DISTANCE)
        ) {
            render_y += (level_bounds.y.max - level_bounds.y.min);
        }
        if ((pl.z + PLAYER_VIEW_DISTANCE > level_bounds.z.max)
            && (this.z < pl.z - PLAYER_VIEW_DISTANCE)
        ) {
            render_z += (level_bounds.z.max - level_bounds.z.min);
        }

        this.model_matrix = m4.translate(this.model_matrix,
            render_x, render_y, render_z);
        this.model_matrix = m4.multiply(this.model_matrix, this.rotation_matrix);
        this.model_matrix = m4.scale(this.model_matrix,
            this.scale, this.scale, this.scale);
    }
}

class ObjColor extends ObjBase {
    constructor(positions, colors) {
        super();
        this.program_holder = program_holder_color;
        this.load_data(positions, colors);
    }

    load_data(positions, colors) {
        this.vao = setup_color_object(positions, colors);
        this.num_vertices = positions.length / 3;
    }

    render() {
        super.prep_model_matrix();
        gl.useProgram(this.program_holder.program);
        gl.bindVertexArray(this.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);
        gl.drawArrays(gl.TRIANGLES, 0, this.num_vertices);
    }
}

class ObjTexture extends ObjBase {
    constructor(model_asset, texture_asset) {
        super();
        var me = this;

        //test coords - TODO: remove
        this.x = 2; this.y = 2; this.z = 2;

        this.texture_asset = texture_asset;
        this.model_asset = model_asset;
    }

    render() {
        super.prep_model_matrix();

        // check distance to player
        var rel_player = [
            player.ship_obj.x - this.model_matrix[12],
            player.ship_obj.y - this.model_matrix[13],
            player.ship_obj.z - this.model_matrix[14],
        ];
        var dist_to_player_sq = (
            rel_player[0] * rel_player[0]
            + rel_player[1] * rel_player[1]
            + rel_player[2] * rel_player[2]
        );
        if (dist_to_player_sq > PLAYER_VIEW_DIST_SQ)
            return;

        // check if behind player
        var render_mat = m4.multiply(viewproj, this.model_matrix);
        if (render_mat[14] < 0)
            return;

        objs_rendered++;
        gl.bindTexture(gl.TEXTURE_2D, this.texture_asset.texture);
        this.model_asset.render(this.model_matrix);
    }
}
