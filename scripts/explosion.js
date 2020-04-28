class Explosion extends ObjBase {
    constructor() {
        super();
        this.age = 0;
        this.max_age = 1;
        this.scale = 2;
        this.max_scale = 15;
        this.palette = [[1, 1, 1], [1, 0, 0], [0, 0, 1], [0, 0, 0]];
        this.num_shrapnel = 20;

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
        var ph = program_holder_explosion;
        gl.useProgram(ph.program);

        super.prep_model_matrix();


        var uNumShrapnelLoc = ph.locations.uNumShrapnelLoc;
        var uCenterLoc = ph.locations.uCenterLoc;
        var uTimeLoc = ph.locations.uTimeLoc;
        var uModelMatrixLoc = ph.locations.uModelMatrixLoc;

        gl.uniform1i(uNumShrapnelLoc, this.num_shrapnel);
        gl.uniform1f(uTimeLoc, this.age / this.max_age);
        gl.uniform4f(uCenterLoc, this.x, this.y, this.z, 1.0);
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);

        gl.drawArrays(gl.POINTS, 0, this.num_shrapnel);
    }
}
