RENDER_COLLIDERS = true;

test_models = {
    sphere: new Model_ColorOnly('models/icosphere.obj'),
    cube:   new Model_ColorOnly('models/cube.obj'),
}

function render_wireframe(wf, model_matrix) {
    gl.useProgram(program_holder_color.program);
    gl.bindVertexArray(wf.vao);
    var uModelMatrixLoc = program_holder_color.locations.uModelMatrixLoc;
    gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
    gl.drawArrays(gl.LINES, 0, wf.num_vertices);
}

function render_sphere_collider(c) {
    //prep model matrix
    var model_matrix = m4.identity();
    model_matrix = m4.translate(model_matrix, ...c.pos);
    model_matrix = m4.scale(model_matrix, c.radius, c.radius, c.radius);

    //render
    render_wireframe(test_models.sphere, model_matrix);
}

function render_prism_collider(c) {
    //prep model matrix
    var model_matrix = m4.identity();
    model_matrix = m4.translate(model_matrix, ...c.pos);
    model_matrix = m4.multiply(model_matrix, c.rotation_matrix);
    model_matrix = m4.scale(model_matrix, c.r_x, c.r_y, c.r_z);

    //render
    render_wireframe(test_models.cube, model_matrix);
}

function render_collider(c) {
    switch(c.collider_type) {
        case 'sphere': render_sphere_collider(c); break;
        case 'point':  /* don't do anything */ break;
        case 'prism':  render_prism_collider(c); break;
    }
}
