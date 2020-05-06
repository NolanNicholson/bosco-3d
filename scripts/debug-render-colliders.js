RENDER_COLLIDERS = true;

const color_collide = [1, 1, 0.5, 1];
const color_nocollide = [0.3, 0.3, 0.3, 1];

function render_sphere_collider(c) {
    //prep model matrix
    var model_matrix = m4.identity();
    model_matrix = m4.translate(model_matrix, ...c.pos);
    model_matrix = m4.scale(model_matrix, c.radius, c.radius, c.radius);

    //render
    var color = (c.has_collided ? color_collide : color_nocollide);
    wireframes.sphere.render(model_matrix, color);
}

function render_prism_collider(c) {
    //prep model matrix
    var model_matrix = m4.identity();
    model_matrix = m4.translate(model_matrix, ...c.pos);
    model_matrix = m4.multiply(model_matrix, c.rotation_matrix);
    model_matrix = m4.scale(model_matrix, c.r_x, c.r_y, c.r_z);

    //render
    var color = (c.has_collided ? color_collide : color_nocollide);
    wireframes.cube.render(model_matrix, color);
}

function render_multi_collider(c) {
    c.components.forEach(comp => {
        render_collider(comp);
    });
}

function render_collider(c) {
    switch(c.collider_type) {
        case 'sphere': render_sphere_collider(c); break;
        case 'point':  /* don't do anything */ break;
        case 'prism':  render_prism_collider(c); break;
        case 'multi':  render_multi_collider(c); break;
    }
}
