const explosion_palettes = {
    cosmo_mine: [[1, 1, 1], [1, 0.2, 0.2], [0, 0.3, 1]],
    base: [[1, 1, 1], [1, 0.7, 0.0], [1, 0.1, 0.1]],
    misc: [[1, 1, 1], [1, 0.7, 0.0], [0.7, 0.7, 0.7]],
    enemy: [[1, 1, 1], [0.7, 0.7, 0.7], [1, 0.1, 0.1]],
}

class Explosion extends ObjBase {
    constructor(params) {
        super();
        this.age = 0;
        this.max_scale = params.size || 2;
        this.palette = params.palette || explosion_palettes.misc;
        this.max_age = params.max_age || 0.5;
        this.num_shrapnel = params.num_shrapnel || 20;
        this.num_clouds = params.num_clouds || 30;
        this.scale = 0;

        //test coords - TODO: remove
        this.x = 2; this.y = 2; this.z = 2;

        var me = this;

        //"base" transformation matrix
        this.base_transform = m4.identity();
        this.base_transform = m4.rotate_x(this.base_transform,
            Math.random() * 2 * Math.PI);
        this.base_transform = m4.rotate_z(this.base_transform,
            Math.random() * 2 * Math.PI);
    }

    relocate(x, y, z) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    update(dt) {
        this.age += dt;
        this.scale = this.max_scale * Math.cbrt(this.age / this.max_age);
    }

    render() {
        var ph_s = program_holder_shrapnel;
        gl.useProgram(ph_s.program);

        super.prep_model_matrix();
        this.model_matrix = m4.multiply(this.model_matrix, this.base_transform);

        // Shrapnel: assign uniforms
        var uNumShrapnelLoc = ph_s.locations.uNumShrapnelLoc;
        var uCenterLoc = ph_s.locations.uCenterLoc;
        var uTimeLoc = ph_s.locations.uTimeLoc;
        var uPaletteLoc = ph_s.locations.uPaletteLoc;
        var uModelMatrixLoc = ph_s.locations.uModelMatrixLoc;

        gl.uniform1i(uNumShrapnelLoc, this.num_shrapnel);
        gl.uniform1f(uTimeLoc, this.age / this.max_age);
        gl.uniform4f(uCenterLoc, this.x, this.y, this.z, 1.0);
        gl.uniform3fv(uPaletteLoc, this.palette.flat());
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);

        // Shrapnel: draw
        gl.drawArrays(gl.POINTS, 0, this.num_shrapnel);

        var ph_e = program_holder_explosion;
        gl.useProgram(ph_e.program);

        // Clouds: assign uniforms
        var uNumCloudsLoc = ph_e.locations.uNumCloudsLoc;
        var uCenterLoc = ph_e.locations.uCenterLoc;
        var uTimeLoc = ph_e.locations.uTimeLoc;
        var uPaletteLoc = ph_e.locations.uPaletteLoc;
        var uModelMatrixLoc = ph_e.locations.uModelMatrixLoc;

        gl.uniform1i(uNumCloudsLoc, this.num_clouds);
        gl.uniform1f(uTimeLoc, this.age / this.max_age);
        gl.uniform4f(uCenterLoc, this.x, this.y, this.z, 1.0);
        gl.uniform3fv(uPaletteLoc, this.palette.flat());
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);

        // Clouds: draw
        gl.disable(gl.CULL_FACE);
        gl.drawArrays(gl.TRIANGLES, 0, this.num_clouds * 3);
        gl.enable(gl.CULL_FACE);
    }
}
