function distance(p1, p2) {
    var dx = p1[0] - p2[0];
    var dy = p1[1] - p2[1];
    var dz = p1[2] - p2[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

class Collider {
    prep() {
        this.has_collided = false;
    }

    collides_point(other) { return false; }
    collides_sphere(other) { return false; }
    collides_prism(other) { return false; }

    collides(other) {
        switch (other.collider_type) {
            case 'point':   return this.collides_point(other);
            case 'prism':   return this.collides_prism(other);
            case 'sphere':  return this.collides_sphere(other);
            default:        return false;
        }
    }
}

class ColliderPoint extends Collider {
    constructor(x, y, z) {
        super();
        this.pos = [x, y, z];
        this.collider_type = 'point';
    }

    collides_point(other)  { return false; }
    collides_sphere(other) { return other.collides_point(this); }
    collides_prism(other)  { return other.collides_point(this); }
}

class ColliderSphere extends Collider {
    constructor(x, y, z, radius) {
        super();
        this.pos = [x, y, z];
        this.radius = radius;
        this.collider_type = 'sphere';
    }

    collides_point(other) {
        return distance(this.pos, other.pos) <= this.radius;
    }

    collides_sphere(other) {
        return distance(this.pos, other.pos) <=
            (this.radius + other.radius)
    }

    collides_prism(other) {
        return other.collides_sphere(this);
    }
}

class ColliderPlane extends Collider {
    constructor(p1, p2, p3) {
        super();
        this.update_plane(p1, p2, p3);
    }

    update_plane(p1, p2, p3) {
        this.p_ref = p1;
        var PQ = v3.minus(p1, p2);
        var PR = v3.minus(p1, p3);
        this.normal = v3.normalize(v3.cross(PQ, PR));
    }

    collides_point(other) {
        return v3.dot(this.normal, v3.minus(other.pos, this.p_ref)) >= 0;
    }
}

class ColliderPrism extends Collider {
    constructor(x, y, z, r_x, r_y, r_z) {
        super();
        this.pos = [x, y, z];
        this.collider_type = 'prism';
        this.rotation_matrix = m4.identity();

        this.r_x = r_x || 1;
        this.r_y = r_y || 1;
        this.r_z = r_z || 1;
    }

    prep() {
        super.prep();
        // minimum and maximum radii - used for quick spherical checks
        this.r_max = distance([0, 0, 0], [this.r_x, this.r_y, this.r_z]);
        this.r_min = Math.min(this.r_x, this.r_y, this.r_z);

        this.inv_rot = m4.inverse(this.rotation_matrix);
    }

    collides_point(other) {
        //first, do (cheaper) spherical collision checks
        var dist = distance(this.pos, other.pos);
        if (dist > this.r_max) return false;
        else if (dist <= this.r_min) return true;

        //if it's between the two, we do the more expensive check
        else {
            //TODO
            var point_relative = m4.identity();
            point_relative = m4.multiply(point_relative,
                this.inv_rot);
            point_relative = m4.translate(point_relative,
                ...v3.minus(other.pos, this.pos));

            var pr_x = point_relative[12];
            var pr_y = point_relative[13];
            var pr_z = point_relative[14];
            return (
                   pr_x >= -this.r_x
                && pr_x <=  this.r_x
                && pr_y >= -this.r_y
                && pr_y <=  this.r_y
                && pr_z >= -this.r_z
                && pr_z <=  this.r_z
            );
        }
    }

    collides_sphere(other) {
        //first, do (cheaper) spherical collision checks
        var dist = distance(this.pos, other.pos);
        if (dist > this.r_max + other.radius) return false;
        else if (dist <= this.r_min + other.radius) return true;

        //if it's between the two, we do the more expensive check
        else {
            //TODO
            return true;
        }
    }

    collides_prism(other) {
        //first, do (cheaper) spherical collision checks
        var dist = distance(this.pos, other.pos);
        if (dist > this.r_max + other.r_max) return false;
        else if (dist <= this.r_min + other.r_min) return true;

        //if it's between the two, we do the more expensive check
        else {
            //TODO
            return true;
        }
    }
}

function resolve_collisions(all_colliders) {
    //preparatory calculations for all colliders
    all_colliders.forEach(c => {
        c.collider.prep();
    });

    //collision check
    //TODO: this is O(n^2) and could probably be optimized)
    var i1; var i2;
    var c1; var c2;
    for (i1 = 0; i1 < all_colliders.length; i1++) {
        c1 = all_colliders[i1];
        for (i2 = i1 + 1; i2 < all_colliders.length; i2++) {
            c2 = all_colliders[i2];
            if (c1.collider.collides(c2.collider)) {
                c1.collider.has_collided = true;
                c2.collider.has_collided = true;
                console.log(c1.type, c2.type);
                c1.collision_event(c2);
                c2.collision_event(c1);
            }
        }
    }
}
