//The possible styles a formation can take
const formation_styles = [
    { // 'cross'
        x: [ 0,  0, -1,  1],
        z: [-1,  1,  0,  0],
    }
];

class FormationLeader extends Enemy {
    constructor(enemy_type) {
        super(enemy_type);
        switch(enemy_type) {
            case 'p': this.texture_asset = textures.enemy_p_alt; break;
        }
        this.is_in_formation = true;
    }
}

class FormationFollower extends Enemy {
    constructor(enemy_type, leader, pos_x, pos_z) {
        super(enemy_type);
        this.leader = leader;
        this.pos_x = pos_x;
        this.pos_z = pos_z;
        this.is_in_formation = true;
    }

    sync_leader() {
        this.rotation_matrix = this.leader.rotation_matrix;
        this.x = this.leader.x + (this.pos_x * 3);
        this.y = this.leader.y;
        this.z = this.leader.z + (this.pos_z * 3);
    }

    update(dt) {
        this.sync_leader();
        this.explodable_update(dt);
    }
}

class Formation {
    constructor(x, y, z) {
        var enemy_type = 'p';
        var formation_style_index = Math.floor(
            Math.random() * formation_styles.length);
        var formation_style = formation_styles[formation_style_index];

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
