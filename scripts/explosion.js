class Explosion extends ObjBase {
    constructor() {
        super();
        this.age = 0;
        this.max_age = 1;
        this.scale = 2;
        this.max_scale = 15;
        this.palette = [[1, 1, 1], [1, 0, 0], [0, 0, 1]];
        this.num_shrapnel = 20;
        this.num_clouds = 20;

        //test coords - TODO: remove
        this.x = 2; this.y = 2; this.z = 2;

        var me = this;
        //fetch the object file
        //"base" transformation matrix
        this.base_transform = m4.identity();
    }

    update(dt) {
        this.age += dt;
        this.scale = this.max_scale * Math.cbrt(this.age / this.max_age);
    }

    render() {
        var ph_s = program_holder_shrapnel;
        gl.useProgram(ph_s.program);

        super.prep_model_matrix();

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

        gl.uniform1i(uNumCloudsLoc, this.num_shrapnel);
        gl.uniform1f(uTimeLoc, this.age / this.max_age);
        gl.uniform4f(uCenterLoc, this.x, this.y, this.z, 1.0);
        gl.uniform3fv(uPaletteLoc, this.palette.flat());
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);

        // Clouds: draw
        gl.drawArrays(gl.POINTS, 0, this.num_shrapnel);
    }
}
