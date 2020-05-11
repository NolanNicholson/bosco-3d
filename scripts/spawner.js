class RandomEnemySpawner {
    constructor() {
        this.timer = 0;
        this.interval = 4;
        this.num_enemies = 0;
        this.max_num_enemies = 4;
        this.formation_active = false;
    }
    
    spawn_enemy() {
        //randomly spawn either a P or I-type
        var new_type = (Math.random() > 0.5 ? 'p' : 'i');
        var new_enemy = new Enemy(new_type);

        var new_location_matrix = m4.translation(
            player.ship_obj.x, player.ship_obj.y, player.ship_obj.z);
        var spawn_angle = Math.random() * 2 * Math.PI;
        var spawn_radius = 20;
        //var spawn_z = (Math.random() > 0.5 ? -10 : 10);
        var spawn_z = -10;
        new_location_matrix = m4.multiply(new_location_matrix,
            player.rotation_matrix);
        new_location_matrix = m4.translate(new_location_matrix,
            spawn_radius * Math.cos(spawn_angle),
            spawn_radius * Math.sin(spawn_angle), spawn_z);

        new_enemy.x = new_location_matrix[12];
        new_enemy.y = new_location_matrix[13];
        new_enemy.z = new_location_matrix[14];

        objects.push(new_enemy);
        this.new_enemy = new_enemy;

        if (!this.num_enemies) {
            sounds.alert_alert.play();
            sounds.player_drive_start.stop();
            sounds.player_drive_loop.stop();
            if (sounds.player_drive_start.source &&
                sounds.player_drive_start.source.onended) {
                sounds.player_drive_start.source.onended = null;
            }

            sounds.enemy_drive_loop.play(true);
        }

        this.num_enemies++;
    }

    lose_enemy() {
        this.num_enemies--;
        console.log("lost enemy (", this.num_enemies, ")");
        if (!this.num_enemies && player.state == 'driving') {
            sounds.enemy_drive_loop.stop();
            sounds.player_drive_loop.play(true);
        }
    }

    spawn_formation() {
        sounds.battle_stations.play();
        this.formation = new Formation(-40, 0, 0);
        this.formation_active = true;
    }

    get_new_enemy_pan() {
        if (!this.new_enemy) return 0;

        var relative_enemy_position = [
            this.new_enemy.x - player.ship_obj.x,
            this.new_enemy.y - player.ship_obj.y,
            this.new_enemy.z - player.ship_obj.z
        ];

        // rotate the relative enemy position to the player's field of view
        var mat = m4.translate(m4.inverse(player.rotation_matrix),
            ...relative_enemy_position);

        var x = mat[12]; var z = mat[14];
        return (x / Math.sqrt(x*x + z*z));

    }

    update(dt) {
        sounds.enemy_drive_loop.pan(this.get_new_enemy_pan());

        //don't spawn, or update spawn timer, unless the player is driving
        //and we have less than the maximum number of enemies
        if (player.state != 'driving' ||
            this.num_enemies >= this.max_num_enemies ||
            this.formation_active) {
            return;
        }

        this.timer += dt;
        if (this.timer >= this.interval) {
            this.spawn_enemy();
            console.log("spawned enemy (", this.num_enemies, ")");
            this.timer = 0;
        }
    }
}
