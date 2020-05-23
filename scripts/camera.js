const CAMERA_VANTAGE = [0, 3, 18];

class Camera {
    follow_player(player) {
        this.x = player.x + CAMERA_VANTAGE[0];
        this.y = player.y + CAMERA_VANTAGE[1];
        this.z = player.z + CAMERA_VANTAGE[2];
    }

    get_view_matrix_player(player) {
        var player_pos = [player.x, player.y, player.z];

        // The camera follows behind (and slightly above) the player
        var camera_pos = CAMERA_VANTAGE;
        camera_pos = m4.apply_transform(camera_pos, player.rotation_matrix);
        camera_pos = v3.plus(camera_pos, player_pos);

        var up = m4.apply_transform([0, 1, 0], player.rotation_matrix);

        var camera_matrix = m4.lookAt(camera_pos, player_pos, up);
        var view_matrix = m4.inverse(camera_matrix);
        return view_matrix;
    }
};
