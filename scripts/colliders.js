class ColliderPoint {
    constructor(x, y, z) {
        this.pos = [x, y, z];
        this.collider_type = 'point';
        this.has_collided = false; // whether a collision happened this frame
    }

    collides(other) {
        switch (other.collider_type) {
            case 'point':   return false;
            case 'prism':
            case 'sphere':  return other.collides_point(this);
            default:        return false;
        }
    }
}

function distance(p1, p2) {
    var dx = p1[0] - p2[0];
    var dy = p1[1] - p2[1];
    var dz = p1[2] - p2[2];
    return Math.sqrt(dx*dx + dy*dy + dz*dz);
}

class ColliderSphere {
    constructor(x, y, z, radius) {
        this.pos = [x, y, z];
        this.radius = radius;
        this.collider_type = 'sphere';
        this.has_collided = false; // whether a collision happened this frame
    }

    collides_point(other) {
        return distance(this.pos, other.pos) <= this.radius;
    }

    collides_sphere(other) {
        return distance(this.pos, other.pos) <=
            (this.radius + other.radius)
    }

    collides(other) {
        switch (other.collider_type) {
            case 'sphere':  return this.collides_sphere(other);
            case 'point':   return this.collides_point(other);
            default:        return false;
        }
    }
}

class ColliderPlane {
    constructor(p1, p2, p3) {
        this.update_plane(p1, p2, p3);
        this.has_collided = false; // whether a collision happened this frame
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

class ColliderPrism {
    constructor(x, y, z, r_x, r_y, r_z) {
        this.pos = [x, y, z];
        this.collider_type = 'prism';
        this.rotation_matrix = m4.identity();

        this.r_x = r_x || 1;
        this.r_y = r_y || 1;
        this.r_z = r_z || 1;
    }

    collides_point(other) {
        //first, do a (cheaper) spherical collision check
        this.r_max = distance([0, 0, 0], [this.r_x, this.r_y, this.r_z]);
        if (distance(this.pos, other.pos) > this.r_max) return false;
        else {
            //TODO
            return true;
        }
    }

    collides(other) {
        switch (other.collider_type) {
            case 'point': return this.collides_point(other);
            default: return false;
        }
    }
}

function resolve_collisions(all_colliders) {
    //debug: reset colliders so only collisions show
    all_colliders.forEach(c => {
        c.collider.has_collided = false;
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
