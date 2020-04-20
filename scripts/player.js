function prism(w, h, d) {
    // w: width (x); h: height (y); d: depth (z)
    w /= 2; h /= 2; d /= 2;

    // vertex positions
    var v = [
        [-w, -h, -d],
        [+w, -h, -d],
        [-w, +h, -d],
        [+w, +h, -d],
        [-w, -h, +d],
        [+w, -h, +d],
        [-w, +h, +d],
        [+w, +h, +d],
    ];

    var faces = [
        [0, 1, 3, 2],
        [0, 2, 6, 4],
        [1, 5, 7, 3],
        [4, 6, 7, 5],
        [2, 3, 7, 6],
        [0, 4, 5, 1],
    ];

    var positions = [];
    faces.forEach(face => {
        positions.push(...v[face[0]]);
        positions.push(...v[face[1]]);
        positions.push(...v[face[2]]);
        positions.push(...v[face[0]]);
        positions.push(...v[face[2]]);
        positions.push(...v[face[3]]);
    });

    return positions;
}

class PlayerBullet extends ObjColor {
    constructor() {
        var positions = prism(1, 2, 1);

        var colors = [];
        for (var i = 0; i < 36; i++) {
            colors.push(1, 1, 1);
        }
        super(positions, colors);

        this.active = false;
    }
}

class Player {
    constructor(ship_model_asset, ship_texture_asset) {
        this.program_holder = program_holder_texture;
        this.bullets = [new PlayerBullet(), new PlayerBullet()];
        this.ship_obj = new ObjTexture(ship_model_asset, ship_texture_asset);

        //movement flags
        this.yawing_left = false;       this.yawing_right = false;
        this.pitching_up = false;         this.pitching_down = false;

        //"base" transformation matrix:
        //the model's .obj file as-is needs to be rotated and scaled
        this.ship_transform_base = m4.identity();
        this.ship_transform_base = m4.scale(this.ship_transform_base,
            0.2, 0.2, 0.2);
        this.ship_transform_base = m4.translate(this.ship_transform_base,
            1.5, 0, 0);
        this.ship_transform_base = m4.rotate_y(this.ship_transform_base,
            Math.PI * 3 / 2);

        //ship speed
        this.drive_speed = 10;

        //direction and adjustment speed
        this.pitch = 0; this.yaw = 0;
        this.pitch_target = 0; this.yaw_target = 0;
        this.tack_anim_speed = 0.1;
        this.pitch_speed = 2;
        this.yaw_speed = 2;

        //current rotation
        this.rotation_matrix = m4.identity();

        //assets
        this.ship_model_asset = ship_model_asset;
        this.ship_texture_asset = ship_texture_asset;
    }

    fire() {
        var first_bullet = this.bullets[0];
        first_bullet.active = true;
        first_bullet.x = this.ship_obj.x;
        first_bullet.y = this.ship_obj.y;
        first_bullet.z = this.ship_obj.z;
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
            case 32: // Spacebar
                this.fire();
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
            case 32: // Spacebar
                break;
            default:
                console.log("Key Up:", e.keyCode);
        }
    }

    update(dt) {
        this.yaw_target = (this.yawing_left - this.yawing_right) * Math.PI / 6;
        this.pitch_target = (this.pitching_up - this.pitching_down)
            * Math.PI / 6;

        if (this.yaw > this.yaw_target) {
            this.yaw -= Math.min(
                this.yaw - this.yaw_target, this.tack_anim_speed);
        } else if (this.yaw < this.yaw_target) {
            this.yaw += Math.min(
                this.yaw_target - this.yaw, this.tack_anim_speed);
        }
        if (this.pitch > this.pitch_target) {
            this.pitch -= Math.min(
                this.pitch - this.pitch_target, this.tack_anim_speed);
        } else if (this.pitch < this.pitch_target) {
            this.pitch += Math.min(
                this.pitch_target - this.pitch, this.tack_anim_speed);
        }

        //update rotation matrix using pitch and yaw
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
            this.pitch * this.pitch_speed * dt);
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            this.yaw * this.yaw_speed * dt);

        //use a movement matrix to get new ship coordinates
        var movement_matrix = m4.identity();

        movement_matrix = m4.translate(movement_matrix,
            this.ship_obj.x, this.ship_obj.y, this.ship_obj.z);

        movement_matrix = m4.multiply(movement_matrix, this.rotation_matrix);

        movement_matrix = m4.translate(movement_matrix,
            0, 0, -this.drive_speed * dt);

        this.ship_obj.x = movement_matrix[12];
        this.ship_obj.y = movement_matrix[13];
        this.ship_obj.z = movement_matrix[14];

    }

    render() {
        var model_matrix = m4.identity();
        model_matrix = m4.translate(model_matrix,
            this.ship_obj.x, this.ship_obj.y, this.ship_obj.z);

        //ship's actual rotation
        model_matrix = m4.multiply(model_matrix, this.rotation_matrix);

        //(purely cosmetic) pitch/yaw rotations
        model_matrix = m4.rotate_x(model_matrix, this.pitch);
        model_matrix = m4.rotate_z(model_matrix, this.yaw);

        //base model transformation
        model_matrix = m4.multiply(model_matrix, this.ship_transform_base);

        this.ship_obj.model_matrix = model_matrix;

        gl.bindTexture(gl.TEXTURE_2D, this.ship_texture_asset.texture);

        gl.bindVertexArray(this.ship_model_asset.vao);
        var uModelMatrixLoc = this.program_holder.locations.uModelMatrixLoc;
        gl.uniformMatrix4fv(uModelMatrixLoc, false, model_matrix);
        gl.drawArrays(gl.TRIANGLES, 0, this.ship_model_asset.num_vertices);

        if (this.bullets[0].active) {
            this.bullets[0].render();
        }
    }
}
