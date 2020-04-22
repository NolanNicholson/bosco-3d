RENDER_COLLIDERS = true;

test_models = {
    sphere: new Model_ColorOnly('models/icosphere.obj'),
}

function render_point_collider(c) {
}

function render_sphere_collider(c) {
    //prep model matrix
    var model_matrix = m4.identity();
    model_matrix = m4.translate(model_matrix,
        ...c.pos);
    model_matrix = m4.scale(model_matrix, c.radius, c.radius, c.radius);

    //render
    gl.useProgram(program_holder_color.program);
    gl.bindVertexArray(test_models.sphere.vao);
    var uModelMatrixLoc = program_holder_color.locations.uModelMatrixLoc;
    gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
    gl.drawArrays(gl.LINES, 0, test_models.sphere.num_vertices);
}

function render_collider(c) {
    switch(c.collider_type) {
        case 'sphere': render_sphere_collider(c); break;
        case 'point':  render_point_collider(c); break;
    }
}
