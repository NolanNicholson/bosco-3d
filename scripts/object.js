function setup_color_object(positions, colors) {

    //locations within the GL program
    var locs = program_holder_color.locations;

    //create and bind a VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var num_vertices = positions.length / 3;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    //tell WebGL which attributes will come from buffers
    gl.enableVertexAttribArray(locs.positionAttributeLocation);
    gl.enableVertexAttribArray(locs.colorAttributeLocation);

    var size = 3;          // 3 values per step
    var type = gl.FLOAT;   // data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each step
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(locs.positionAttributeLocation,
        size, type, normalize, stride, offset);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    //All of the previous params for gl.vertexAttribPointer are still correct.
    gl.vertexAttribPointer(locs.colorAttributeLocation,
        size, type, normalize, stride, offset);

    return vao;
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

    prep_model_matrix() {
        this.model_matrix = m4.identity();
        this.model_matrix = m4.translate(this.model_matrix,
            this.x, this.y, this.z);
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
        this.program_holder = program_holder_texture;

        this.rotation_matrix = m4.identity();
    }

    render() {
        gl.bindTexture(gl.TEXTURE_2D, this.texture_asset.texture);

        super.prep_model_matrix();
        this.model_matrix = m4.multiply(this.model_matrix,
            this.model_asset.base_transform);

        this.model_asset.render(this.model_matrix);
    }
}
