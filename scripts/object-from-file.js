class ObjTexture extends ObjColor {
    constructor(model_asset, texture_asset) {
        super([], []);
        var me = this;

        //test coords - TODO: remove
        this.scale = 0.2;
        this.x = 2;
        this.y = 2;
        this.z = 2;
        this.r_vy = 0;
        this.r_y = Math.PI * 3 / 2;

        this.texture_asset = texture_asset;
        this.model_asset = model_asset;
        this.program_holder = program_holder_texture;
    }

    update(dt) {
        this.r_y += this.r_vy * dt;
    }

    render() {
        gl.bindTexture(gl.TEXTURE_2D, this.texture_asset.texture);

        this.model_matrix = m4.identity();
        this.model_matrix = m4.translate(this.model_matrix,
            this.x, this.y, this.z);
        this.model_matrix = m4.rotate_x(this.model_matrix, this.r_x);
        this.model_matrix = m4.rotate_y(this.model_matrix, this.r_y);
        this.model_matrix = m4.rotate_z(this.model_matrix, this.r_z);
        this.model_matrix = m4.scale(this.model_matrix,
            this.scale, this.scale, this.scale);

        gl.bindVertexArray(this.model_asset.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, this.model_matrix);
        gl.drawArrays(gl.TRIANGLES, 0, this.model_asset.num_vertices);
    }
}
