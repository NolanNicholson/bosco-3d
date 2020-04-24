class Enemy extends ObjTexture {
    constructor(enemy_type) {
        var model; var texture;
        switch(enemy_type) {
            case 'p':
                model = models.enemy_p;
                texture = textures.enemy_p;
                break;
            case 'e':
                model = models.enemy_e;
                texture = textures.enemy_e;
                break;
            case 'spy':
                model = models.enemy_spy;
                texture = textures.enemy_spy;
                break;
            case 'i':
            default:
                model = models.enemy_i;
                texture = textures.enemy_i;
                break;
        }

        super(model, texture);

        //collider: identical for all enemies except the E-Type
        if (enemy_type == 'e') {
            this.collider = new ColliderPrism(0, 0, 0, 0.5, 0.5, 1);
        } else {
            this.collider = new ColliderPrism(0, 0, 0, 1, 0.5, 1);
        }
        all_colliders.push(this);

        if (enemy_type == 'e')
            this.r_vz = 4;
    }

    update(dt) {
        super.update(dt);

        //sync collider with main object
        this.collider.pos = [this.x, this.y, this.z];
        this.collider.rotation_matrix = this.rotation_matrix;
    }
}
