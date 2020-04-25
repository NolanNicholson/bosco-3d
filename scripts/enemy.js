class Enemy extends ObjTexture {
    constructor(enemy_type) {
        var model; var texture; var death_sound;
        switch(enemy_type) {
            case 'p':
                model = models.enemy_p;
                texture = textures.enemy_p;
                death_sound = sounds.p_type_hit;
                break;
            case 'e':
                model = models.enemy_e;
                texture = textures.enemy_e;
                death_sound = sounds.e_type_hit;
                break;
            case 'spy':
                model = models.enemy_spy;
                texture = textures.enemy_spy;
                death_sound = sounds.i_type_spy_hit;
                break;
            case 'i':
            default:
                model = models.enemy_i;
                texture = textures.enemy_i;
                death_sound = sounds.i_type_spy_hit;
                break;
        }

        super(model, texture);
        this.death_sound = death_sound;

        //collider: identical for all enemies except the E-Type
        if (enemy_type == 'e') {
            this.collider = new ColliderPrism(0, 0, 0, 0.5, 0.5, 1);
        } else {
            this.collider = new ColliderPrism(0, 0, 0, 1, 0.5, 1);
        }
        all_colliders.push(this);

        if (enemy_type == 'e')
            this.r_vz = 4;
        this.type = 'enemy';
    }

    update(dt) {
        super.update(dt);

        //sync collider with main object
        this.collider.pos = [this.x, this.y, this.z];
        this.collider.rotation_matrix = this.rotation_matrix;
    }

    collision_event(other) {
        switch(other.type) {
            case 'player_bullet':
                if (other.active) {
                    this.death_sound.play();
                    other.active = false;
                }
        }
    }
}
