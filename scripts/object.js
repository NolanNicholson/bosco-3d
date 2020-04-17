function setup_object(positions, colors) {
    //create and bind a VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var num_vertices = positions.length / 3;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    //tell WebGL which attributes will come
    //from a buffer, not a constant value
    //TODO: this should be per-program?
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(colorAttributeLocation);

    var size = 3;          // 3 values per step
    var type = gl.FLOAT;   // data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each step
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    var colorBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(colors), gl.STATIC_DRAW);

    //All of the previous calls to gl.vertexAttribPointer are still good
    size = 3;
    gl.vertexAttribPointer(
        colorAttributeLocation, size, type, normalize, stride, offset);

    return vao;
}

function setup_textured_object(positions, texcoords) {
    //create and bind a VAO
    var vao = gl.createVertexArray();
    gl.bindVertexArray(vao);

    var num_vertices = positions.length / 3;

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    //tell WebGL which attributes will come
    //from a buffer, not a constant value
    gl.enableVertexAttribArray(positionAttributeLocation);
    gl.enableVertexAttribArray(texCoordAttributeLocation);

    var size = 3;          // 3 values per step
    var type = gl.FLOAT;   // data is 32bit floats
    var normalize = false; // don't normalize the data
    var stride = 0;        // 0 = move forward size * sizeof(type) each step
    var offset = 0;        // start at the beginning of the buffer
    gl.vertexAttribPointer(
        positionAttributeLocation, size, type, normalize, stride, offset);

    var texCoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    //Most of the previous calls to gl.vertexAttribPointer are still good -
    //we just have to update the size since each vertex has only 2 tex coords
    size = 2;
    gl.vertexAttribPointer(
        texCoordAttributeLocation, size, type, normalize, stride, offset);

    return vao;
}

class Obj3D {
    constructor(positions, colors) {
        this.x = 0; this.y = 0; this.z = 0;
        this.r_x = 0; this.r_y = 0; this.r_z = 0;
        this.scale = 1;
        this.model_matrix = m4.identity();

        this.load_data(positions, colors);
    }

    load_data(positions, colors) {
        this.vao = setup_object(positions, colors);
        this.num_vertices = positions.length / 3;
    }

    reset() {
    }

    update(dt) {
        this.r_x += this.r_vx * dt;
        this.r_y += this.r_vy * dt;
        this.r_z += this.r_vz * dt;
    }

    render() {
        this.model_matrix = m4.identity();
        this.model_matrix = m4.translate(this.model_matrix,
            this.x, this.y, this.z);
        this.model_matrix = m4.rotate_x(this.model_matrix, this.r_x);
        this.model_matrix = m4.rotate_y(this.model_matrix, this.r_y);
        this.model_matrix = m4.rotate_z(this.model_matrix, this.r_z);
        this.model_matrix = m4.scale(this.model_matrix,
            this.scale, this.scale, this.scale);

        gl.bindVertexArray(this.vao);
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);
        gl.drawArrays(gl.TRIANGLES, 0, this.num_vertices);
    }
}
