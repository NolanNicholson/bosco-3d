class Logo {
    constructor(obj_filename) {
        this.age = 0;

        //fetch the object file
        var me = this;
        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string);
            var positions = obj_file.vertices;
            me.load_data(positions);
            confirm_asset_loaded();
        });
    }

    vao_from_2d_pos(positions) {
        //create and bind a VAO
        var vao = gl.createVertexArray();
        gl.bindVertexArray(vao);

        //supply position data to a new buffer
        var positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER,
            new Float32Array(positions), gl.STATIC_DRAW);

        //set the position attribute up to receive buffer data
        var pos_loc = program_holder_logo.locations.positionAttributeLocation;
        gl.enableVertexAttribArray(pos_loc);
        gl.vertexAttribPointer(pos_loc,
            2 /*size*/, gl.FLOAT /*type*/, false /*normalize*/,
            0 /*stride*/, 0 /*offset*/);

        var num_verts = positions.length / 2;
        return [ vao, num_verts ];
    }

    load_data(positions) {
        // first, need to convert from 3D points to 2D points
        var logo_positions = [];
        for (var i = 0; i < positions.length; i += 3) {
            logo_positions.push(positions[i] * 0.5);
            logo_positions.push(-positions[i + 2] * 0.5);
        }
        [this.logo_vao, this.logo_nv] = this.vao_from_2d_pos(logo_positions)

        var bg_positions = [
            -1, 1, -1, -1, 1, -1, 1, -1, 1, 1, -1, 1];
        [this.bg_vao, this.bg_nv] = this.vao_from_2d_pos(bg_positions);
    }

    update(dt) {
        // (cosmetic) rotation of the player so that the stars move
        player.rotation_matrix = m4.rotate_x(
            player.rotation_matrix, Math.PI * -0.02 * dt);
        player.rotation_matrix = m4.rotate_y(
            player.rotation_matrix, Math.PI * -0.01 * dt);

        [player.x, player.y, player.z] = m4.apply_transform(
            [0, 10, 55], player.rotation_matrix);

        this.age += dt;
    }

    get_rsq(viewport) {
        var width = viewport[2]; var height = viewport[3];
        var max_r_sq = width*width + height*height;

        var progress = 1 * (this.age - 4);
        progress = Math.max(0, Math.min(progress, 1));
        return progress * progress * max_r_sq;
    }

    render() {
        gl.enable(gl.STENCIL_TEST);
        var viewport = getMainViewport(gl.canvas, main_view_sizer);
        var w; var h; [w, h] = [viewport[2], viewport[3]];
        var r_sq = this.get_rsq(viewport);

        var logo_x = Math.max(0, 2 - 0.7 * this.age);
        var logo_y = Math.max(0, 0.7 * (this.age - 11));

        // prepare matrix for correcting the logo's aspect ratio
        var aspect = w / h;
        var scale = 1.05;
        var mat;
        if (aspect > 1)
            mat = m4.scaling(scale / aspect, scale * 0.9, 1);
        else
            mat = m4.scaling(scale, scale * aspect * 0.9, 1);
        mat = m4.translate(mat, logo_x, logo_y, 0);

        [program_holder_logo, program_holder_logo_inv].forEach(ph => {
            gl.useProgram(ph.program);
            gl.uniformMatrix4fv(ph.locations.uMatrixLoc, false, mat);
            gl.uniform1f(ph.locations.uRadiusSqLoc, r_sq);
            gl.uniform1f(ph.locations.uTimeLoc, this.age);
            gl.uniform1f(ph.locations.uXCenterLoc, w / 2);
            gl.uniform1f(ph.locations.uYCenterLoc, h / 2 + viewport[1]);
        });

        gl.disable(gl.CULL_FACE);
        gl.useProgram(program_holder_logo.program);

        // Enable stencil writing, disable depth/color writing
        gl.stencilMask(0xff);
        gl.depthMask(false);
        gl.colorMask(false, false, false, false);

        // Draw the logo geometry to the stencil buffer as 0xff
        gl.stencilFunc(gl.ALWAYS, 0xff, 0xff);
        gl.stencilOp(gl.REPLACE, gl.REPLACE, gl.REPLACE);
        gl.bindVertexArray(this.logo_vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.logo_nv);

        // Reset the transformation matrix
        mat = m4.identity();
        [program_holder_logo, program_holder_logo_inv].forEach(ph => {
            gl.useProgram(ph.program);
            gl.uniformMatrix4fv(ph.locations.uMatrixLoc, false, mat);
        });

        // Draw a rectangle covering the whole screen as invert
        gl.useProgram(program_holder_logo_inv.program);
        gl.stencilFunc(gl.ALWAYS, 1, 0xff);
        gl.stencilOp(gl.INVERT, gl.INVERT, gl.INVERT);
        gl.bindVertexArray(this.bg_vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.bg_nv);

        // Disable stencil writing, enable depth/color writing
        gl.useProgram(program_holder_logo.program);
        gl.stencilMask(0x00);
        gl.depthMask(true);
        gl.colorMask(true, true, true, true);

        // Draw a rectangle covering the whole screen
        // with the desired colors
        gl.stencilFunc(gl.EQUAL, 0, 0xff);

        gl.bindVertexArray(this.bg_vao);
        gl.drawArrays(gl.TRIANGLES, 0, this.bg_nv);
        gl.flush();
        gl.enable(gl.CULL_FACE);
        gl.disable(gl.STENCIL_TEST);

        // Draw NAMCO + Nolan authorship text
        if (this.age > 3) {
            gl.disable(gl.DEPTH_TEST);
            var white = [0.871, 0.871, 0.871, 1];
            var logo_ty = -logo_y * text_renderer.vh_char;

            var t_y = Math.floor(text_renderer.vh_char * 0.7) + logo_ty;
            text_renderer.render(
                "Original © 1981 Namco",   'center', t_y, white);
            text_renderer.render(
                "3D Version By N.Nicholson", 'center', t_y+2, white);

            //render "STAR DESTROYER" after a certain time
            if (this.age > 9.5) {
                var t_y = Math.floor(text_renderer.vh_char * -0.5) + logo_ty;
                text_renderer.render(
                    "Star Destroyer", 'center', t_y, white);
            }

            gl.enable(gl.DEPTH_TEST);
        }
    }
}


