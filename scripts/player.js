class Player {
    constructor(program_holder) {
        this.program_holder = program_holder;
        this.ship_obj = new TexturedObj3D(program_holder,
            "models/player.obj", "models/player_tex.png");

        //movement flags
        this.yawing_left = false;       this.yawing_right = false;
        this.pitching_up = false;         this.pitching_down = false;

        //"base" transformation matrix:
        //the model's .obj file as-is needs to be rotated and scaled
        this.ship_transform_base = m4.identity();
        this.ship_transform_base = m4.scale(this.ship_transform_base,
            0.2, 0.2, 0.2);
        this.ship_transform_base = m4.rotate_y(this.ship_transform_base,
            Math.PI * 3 / 2);

        //direction and adjustment speed
        this.pitch = 0; this.yaw = 0;
        this.pitch_target = 0; this.yaw_target = 0;
        this.tack_speed = 0.2;
    }

    handle_keydown(e) {
        switch(e.keyCode) {
            case 65: // A
                this.yawing_left = true;
                break;
            case 68: // D
                this.yawing_right = true;
                break;
            case 87: // W
                this.pitching_down = true;
                break;
            case 83: // S
                this.pitching_up = true;
                break;
            default:
                console.log("Key Down:", e.keyCode);
        }
    }

    handle_keyup(e) {
        switch(e.keyCode) {
            case 65: // A
                this.yawing_left = false;
                break;
            case 68: // D
                this.yawing_right = false;
                break;
            case 87: // W
                this.pitching_down = false;
                break;
            case 83: // S
                this.pitching_up = false;
                break;
            default:
                console.log("Key Down:", e.keyCode);
        }
    }

    update(dt) {
        // Update ship coordinates

        this.yaw_target = (this.yawing_left - this.yawing_right) * Math.PI / 6;
        this.pitch_target = (this.pitching_up - this.pitching_down)
            * Math.PI / 6;

        //this.yaw = this.yaw_target;
        //this.pitch = this.pitch_target;

        if (this.yaw > this.yaw_target) {
            this.yaw -= Math.min(this.yaw - this.yaw_target, this.tack_speed);
        } else if (this.yaw < this.yaw_target) {
            this.yaw += Math.min(this.yaw_target - this.yaw, this.tack_speed);
        }
        if (this.pitch > this.pitch_target) {
            this.pitch -= Math.min(this.pitch - this.pitch_target, this.tack_speed);
        } else if (this.pitch < this.pitch_target) {
            this.pitch += Math.min(this.pitch_target - this.pitch, this.tack_speed);
        }

        var transform = m4.identity();
        transform = m4.rotate_y(transform, Math.PI / 2);

        this.ship_obj.r_x = this.pitch;
        this.ship_obj.r_y = 0;
        this.ship_obj.r_z = this.yaw;

    }

    render() {
        var model_matrix = m4.identity();
        model_matrix = m4.translate(model_matrix,
            this.ship_obj.x, this.ship_obj.y, this.ship_obj.z);
        model_matrix = m4.rotate_x(model_matrix, this.ship_obj.r_x);
        model_matrix = m4.rotate_y(model_matrix, this.ship_obj.r_y);
        model_matrix = m4.rotate_z(model_matrix, this.ship_obj.r_z);
        model_matrix = m4.multiply(model_matrix, this.ship_transform_base);
        this.ship_obj.model_matrix = this.model_matrix;

        gl.bindTexture(gl.TEXTURE_2D, this.ship_obj.texture);

        gl.bindVertexArray(this.ship_obj.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
        gl.drawArrays(gl.TRIANGLES, 0, this.ship_obj.num_vertices);
    }
}
