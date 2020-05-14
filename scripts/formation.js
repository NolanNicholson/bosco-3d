//The possible styles a formation can take
const formation_styles = [
    { // 'cross'
        x: [ 0,  0, -1,  1],
        z: [-1,  1,  0,  0],
        hud_asset: images.formation_cross,
    },
    { // 'v'
        x: [-2, -1,  1,  2],
        z: [ 2,  1,  1,  2],
        hud_asset: images.formation_v,
    },
    { // straight line
        x: [ 1,  2,  3,  4],
        z: [ 0,  0,  0,  0],
        hud_asset: images.formation_i,
    }
];

class FormationLeader extends Enemy {
    constructor(enemy_type) {
        super(enemy_type);
        switch(enemy_type) {
            case 'p': this.texture_asset = textures.enemy_p_alt; break;
            case 'e': this.texture_asset = textures.enemy_e_alt; break;
            case 'i': this.texture_asset = textures.enemy_i_alt; break;
        }
        this.is_in_formation = true;
        this.drive_speed = 60;
        this.explode_sound = sounds.formation_hit;
        this.worth *= 2;
        this.collider.group = 'base';
        this.ai_mode = 'close-in';
    }

    explode() {
        super.explode();

        // phone home that the formation has expired
        spawner.end_formation();
    }
}

class FormationFollower extends Enemy {
    constructor(enemy_type, leader, pos_x, pos_z) {
        super(enemy_type);
        this.leader = leader;
        this.pos_x = pos_x;
        this.pos_z = pos_z;
        this.is_in_formation = true;
        this.explode_sound = sounds.formation_hit;
        this.collider.group = 'base';
    }

    sync_leader() {
        this.rotation_matrix = this.leader.rotation_matrix;
        this.x = this.leader.x + (this.pos_x * 3);
        this.y = this.leader.y;
        this.z = this.leader.z + (this.pos_z * 3);
    }

    flee(dt) {
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
            0.5 * this.pos_z * dt);
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            -0.5 * this.pos_x * dt);

        this.move(0, 0, -this.drive_speed * dt);

        var rel_player = this.get_rel_to_player();
        var sq_dist = (
              rel_player[0] * rel_player[0]
            + rel_player[1] * rel_player[1]
            + rel_player[2] * rel_player[2]
        );
        if (sq_dist > 800) {
            console.log("despawned formation member");
            delete_object(this);
        }
    }

    update(dt) {
        if (this.leader && !this.leader.exploded) {
            this.sync_leader();
        } else {
            this.flee(dt);
        }
        this.explodable_update(dt);
    }
}

class Formation {
    constructor(x, y, z) {
        // random enemy type
        var enemy_type = ['e', 'p', 'i'][
            Math.floor(Math.random() * 3)];
        // random formation style
        var formation_style_index = Math.floor(
            Math.random() * formation_styles.length);
        var formation_style = formation_styles[formation_style_index];
        this.hud_asset = formation_style.hud_asset;

        this.leader = new FormationLeader(enemy_type);
        [this.leader.x, this.leader.y, this.leader.z] = [x, y, z];
        this.followers = [];
        for (var i = 0; i < 4; i++) {
            var follower = new FormationFollower(enemy_type, this.leader,
                formation_style.x[i], formation_style.z[i]);
            follower.sync_leader();
            follower.sync_collider();
            this.followers.push(follower);
        }

        // add this formation's ships to the main list of objects
        objects.push(this.leader, ...this.followers);
    }
}
