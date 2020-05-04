RENDER_COLLIDERS = true;

function render_sphere_collider(c) {
    //prep model matrix
    var model_matrix = m4.identity();
    model_matrix = m4.translate(model_matrix, ...c.pos);
    model_matrix = m4.scale(model_matrix, c.radius, c.radius, c.radius);

    //render
    wireframes.sphere.render(model_matrix);
}

function render_prism_collider(c) {
    //prep model matrix
    var model_matrix = m4.identity();
    model_matrix = m4.translate(model_matrix, ...c.pos);
    model_matrix = m4.multiply(model_matrix, c.rotation_matrix);
    model_matrix = m4.scale(model_matrix, c.r_x, c.r_y, c.r_z);

    //render
    wireframes.cube.render(model_matrix);
}

function render_collider(c) {
    switch(c.collider_type) {
        case 'sphere': render_sphere_collider(c); break;
        case 'point':  /* don't do anything */ break;
        case 'prism':  render_prism_collider(c); break;
    }
}
