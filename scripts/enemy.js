function delete_object(o) {
    var collider_list = all_colliders;
    var object_list = objects;

    var collider_index = collider_list.indexOf(o);
    if (collider_index != -1) collider_list.splice(collider_index, 1);

    var obj_index = object_list.indexOf(o);
    if (obj_index != -1) object_list.splice(obj_index, 1);
}

class Explodable extends ObjTexture {
    constructor(model, texture) {
        super(model, texture);
        this.exploded = false;
    }

    update(dt) {
        if (this.exploded) {
            this.explosion.update(dt);
            if (this.explosion.age > this.explosion.max_age) {
                delete_object(this);
            }
        } else {
            super.update(dt);

            //sync collider with main object
            if (this.collider) {
                this.collider.pos = [this.x, this.y, this.z];
                this.collider.rotation_matrix = this.rotation_matrix;
            }
        }
    }

    render() {
        if (this.exploded) {
            this.explosion.render();
        } else {
            super.render();
        }
    }
}

class Enemy extends Explodable {
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

        //the E-Type enemy is a missile, so let's give it a spin effect
        if (enemy_type == 'e')
            this.r_vz = 4;

        this.type = 'enemy';
    }

    collision_event(other) {
        if (!this.exploded) {
            switch(other.type) {
                case 'player_bullet':
                    this.death_sound.play();
                    this.exploded = true;
                    this.explosion = new Explosion({
                        palette: explosion_palettes.enemy,
                    });
                    this.explosion.x = this.x;
                    this.explosion.y = this.y;
                    this.explosion.z = this.z;
                    
                    //remove this from colliders
                    var collider_list = all_colliders;
                    var collider_index = collider_list.indexOf(this);
                    if (collider_index != -1)
                        collider_list.splice(collider_index, 1);
            }
        }
    }
}

class CosmoMine extends Explodable {
    constructor() {
        super(models.cosmo_mine, textures.cosmo_mine);
        this.collider = new ColliderSphere(0, 0, 0, 1.7);
        all_colliders.push(this);
        this.type = 'mine';
    }

    collision_event(other) {
        if (!this.exploded) {
            sounds.mine_hit.play();
            this.exploded = true;
            this.explosion = new Explosion({
                palette: explosion_palettes.cosmo_mine,
                size: 12,
                num_shrapnel: 60,
                num_clouds: 60,
                max_age: 1,
            });
            this.explosion.x = this.x;
            this.explosion.y = this.y;
            this.explosion.z = this.z;
        }
    }

    update(dt) {
        super.update(dt);
        //since the mine's explosion (uniquely) has a collider,
        //we also need to update it
        if (this.exploded) {
            this.collider.radius = this.explosion.scale;
        }
    }
}

class Asteroid extends Explodable {
    constructor() {
        super(models.asteroid1, textures.asteroid);
        this.scale = Math.random() * 2 + 1;
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
            Math.random() * 2 * Math.PI);
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            Math.random() * 2 * Math.PI);
    }
}
