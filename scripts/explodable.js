class Explodable extends ObjTexture {
    constructor(model, texture) {
        super(model, texture);
        this.exploded = false;
        this.explosion_properties = {};
        this.remove_collider_when_exploded = true;
    }

    collision_event(other) {
        if (!this.exploded) {
            this.explode();
        }
    }

    delete_collider() {
        //remove this object's collider from the master list (if it's in it)
        var collider_list = all_colliders;
        var collider_index = collider_list.indexOf(this);
        if (collider_index != -1)
            collider_list.splice(collider_index, 1);
    }

    explode() {
        this.explode_sound.play();
        this.exploded = true;
        this.explosion = new Explosion(this.explosion_properties);
        this.explosion.relocate(this.x, this.y, this.z);

        if (this.remove_collider_when_exploded) {
            this.delete_collider();
        }

        if (this.worth) {
            score += this.worth;
        }
    }

    update(dt) {
        if (this.exploded) {
            this.explosion.update(dt);
            if (this.explosion.age > this.explosion.max_age) {
                this.remove();
            }
        } else {
            super.update(dt);

            //sync collider with main object
            if (this.collider) {
                this.sync_collider();
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

class CosmoMine extends Explodable {
    constructor() {
        super(models.cosmo_mine, textures.cosmo_mine);
        this.collider = new ColliderSphere(0, 0, 0, 1.7);
        this.scale = 2;
        all_colliders.push(this);
        this.explosion_properties = {
            palette: explosion_palettes.cosmo_mine,
            size: 12,
            num_shrapnel: 60,
            num_clouds: 60,
            max_age: 1,
        };
        this.explode_sound = sounds.mine_hit;
        this.remove_collider_when_exploded = false;

        this.type = 'mine';
        this.worth = 20;
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
    constructor(scale) {
        // choose a random model
        var model = (Math.random() > 0.5 ? models.asteroid1 : models.asteroid2);
        super(model, textures.asteroid);

        this.scale = scale;
        this.rotation_matrix = m4.rotate_x(this.rotation_matrix,
            Math.random() * 2 * Math.PI);
        this.rotation_matrix = m4.rotate_y(this.rotation_matrix,
            Math.random() * 2 * Math.PI);

        this.collider = new ColliderSphere(0, 0, 0, this.scale);
        all_colliders.push(this);

        this.explode_sound = sounds.asteroid_hit;
        this.explosion_properties = {
            size: this.scale * 1.3,
        }
        this.type = 'asteroid';
        this.worth = 10;
    }
}
