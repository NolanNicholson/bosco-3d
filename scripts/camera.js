class Camera {
    constructor() {
        //position and velocity
        this.x = 0;     this.y = 0;     this.z = 0;
        this.vx = 0;    this.vy = 0;    this.vz = 0;

        //rotation and rotational speed
        this.rx = 0;    this.ry = 0;
        this.rvx = 0;   this.rvy = 0;

        //movement flags
        this.moving_left = false;       this.moving_right = false;
        this.moving_forward = false;    this.moving_back = false;
        this.moving_up = false;         this.moving_down = false;

        //rotation flags
        this.rotating_left = false;     this.rotating_right = false;
        this.rotating_up = false;       this.rotating_down = false;

        //running flag
        this.speeding = false;
    }

    handle_keydown(e) {
        switch(e.keyCode) {
            case 65: // A
                this.moving_left = true;
                break;
            case 68: // D
                this.moving_right = true;
                break;
            case 87: // W
                this.moving_forward = true;
                break;
            case 83: // S
                this.moving_back = true;
                break;
            case 69: // Q
                this.moving_up = true;
                break;
            case 81: // E
                this.moving_down = true;
                break;
            case 37: // left arrow
                this.rotating_left = true;
                break;
            case 39: // right arrow
                this.rotating_right = true;
                break;
            case 38: // up arrow
                this.rotating_up = true;
                break;
            case 40: // down arrow
                this.rotating_down = true;
                break;
            case 16: // Shift
                this.speeding = true;
                break;
            default:
                console.log("Key Down:", e.keyCode);
        }
    }

    handle_keyup(e) {
        switch(e.keyCode) {
            case 65:
                this.moving_left = false;
                break;
            case 68:
                this.moving_right = false;
                break;
            case 87:
                this.moving_forward = false;
                break;
            case 83:
                this.moving_back = false;
                break;
            case 69:
                this.moving_up = false;
                break;
            case 81:
                this.moving_down = false;
                break;
            case 37: // left arrow
                this.rotating_left = false;
                break;
            case 39: // right arrow
                this.rotating_right = false;
                break;
            case 38: // up arrow
                this.rotating_up = false;
                break;
            case 40: // down arrow
                this.rotating_down = false;
                break;
            case 16: // Shift
                this.speeding = false;
                break;
            default:
                console.log("Key Up:", e.keyCode);
        }
    }

    update(dt) {
        var speed = this.speeding ? 7 : 3;

        // update velocity and position
        this.vx = (this.moving_right - this.moving_left) * speed;
        this.vy = (this.moving_up - this.moving_down) * speed;
        this.vz = (this.moving_back - this.moving_forward) * speed;

        // update rotational velocity and rotation
        this.rvx = (this.rotating_up - this.rotating_down);
        this.rvy = (this.rotating_left - this.rotating_right);

        this.rx += this.rvx * dt;
        this.ry += this.rvy * dt;

        var movement_matrix = m4.identity();
        movement_matrix = m4.translate(movement_matrix,
            this.x, this.y, this.z);
        movement_matrix = m4.rotate_y(movement_matrix, this.ry);
        movement_matrix = m4.rotate_x(movement_matrix, this.rx);

        movement_matrix = m4.translate(movement_matrix,
            this.vx * dt, this.vy * dt, this.vz * dt);

        this.x = movement_matrix[12];
        this.y = movement_matrix[13];
        this.z = movement_matrix[14];
    }

    follow_player(dt, player) {
        this.x = player.ship_obj.x;
        this.y = player.ship_obj.y;
        this.z = player.ship_obj.z + 10;
    }

    get_view_matrix() {
        var camera_matrix = m4.identity();
        camera_matrix = m4.translate(camera_matrix, this.x, this.y, this.z);
        camera_matrix = m4.rotate_y(camera_matrix, this.ry);
        camera_matrix = m4.rotate_x(camera_matrix, this.rx);
        var view_matrix = m4.inverse(camera_matrix);
        return view_matrix;
    }

    get_view_matrix_player(player) {
        var camera_matrix = m4.lookAt(
            [this.x, this.y, this.z],
            [player.ship_obj.x, player.ship_obj.y, player.ship_obj.z],
            [0, 1, 0]
        );
        var view_matrix = m4.inverse(camera_matrix);
        return view_matrix;
    }
};
