const CAMERA_VANTAGE = [0, 3, 18];

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

    follow_player(dt, player) {
        this.x = player.ship_obj.x + CAMERA_VANTAGE[0];
        this.y = player.ship_obj.y + CAMERA_VANTAGE[1];
        this.z = player.ship_obj.z + CAMERA_VANTAGE[2];
    }

    get_view_matrix_player(player) {
        // The camera follows behind (and slightly above) the player
        var camera_pos= m4.identity();
        camera_pos= m4.translate(camera_pos,
            player.ship_obj.x, player.ship_obj.y, player.ship_obj.z);
        camera_pos= m4.multiply(camera_pos,
            player.rotation_matrix);
        camera_pos= m4.translate(camera_pos,
            ...CAMERA_VANTAGE);

        var up = m4.identity();
        up = m4.multiply(up, player.rotation_matrix);
        up = m4.translate(up, 0, 1, 0);

        var camera_matrix = m4.lookAt(
            [camera_pos[12], camera_pos[13], camera_pos[14]],
            [player.ship_obj.x, player.ship_obj.y, player.ship_obj.z],
            [up[12], up[13], up[14]]
        );
        var view_matrix = m4.inverse(camera_matrix);
        return view_matrix;
    }
};
