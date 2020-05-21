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
            case 'multi':   return other.collides(this);
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

        this.inv_rot = false;
    }

    get_inv_rot() {
        if (!this.inv_rot) {
            this.inv_rot = m4.inverse(this.rotation_matrix);
        }
        return this.inv_rot;
    }

    get_relative_point(other_pos) {
        //gets a point's coordinates in the prism's own
        //frame of reference, relative to its center

        var point_relative = v3.minus(other_pos, this.pos);
        point_relative = m4.apply_transform(point_relative, this.get_inv_rot());
        return point_relative;
    }

    point_within(pr) {
        // returns whether or not a point (given in the prism's local,
        // de-rotated frame of reference) is within the prism's bounds
        return (
               pr[0] >= -this.r_x
            && pr[0] <=  this.r_x
            && pr[1] >= -this.r_y
            && pr[1] <=  this.r_y
            && pr[2] >= -this.r_z
            && pr[2] <=  this.r_z
        );
    }

    collides_point(other) {
        //first, do (cheaper) spherical collision checks
        var dist = distance(this.pos, other.pos);
        if (dist > this.r_max) return false;
        else if (dist <= this.r_min) return true;

        //if it's between the two, we do the more expensive check
        else {
            var pr = this.get_relative_point(other.pos);
            return this.point_within(pr);
        }
    }

    collides_sphere(other) {
        //first, do (cheaper) spherical collision checks
        var dist = distance(this.pos, other.pos);
        if (dist > this.r_max + other.radius) return false;
        else if (dist <= this.r_min + other.radius) return true;

        //if it's between the two, we do the more expensive check
        else {
            var pr = this.get_relative_point(other.pos);
            //get the point on the prism closest to the sphere
            var closest_point = [
                Math.max(-this.r_x, Math.min(pr[0], this.r_x)),
                Math.max(-this.r_y, Math.min(pr[1], this.r_y)),
                Math.max(-this.r_z, Math.min(pr[2], this.r_z)),
            ];
            return (distance(closest_point, pr) <= other.radius);
        }
    }

    collides_prism_sub(other) {
        // Tests whether two prisms collide, using
        // (a simplified version of) the Separating Axis Theorem
        var relative_pos = v3.minus(other.pos, this.pos);
        var x_min = Infinity; var x_max = -Infinity;
        var y_min = Infinity; var y_max = -Infinity;
        var z_min = Infinity; var z_max = -Infinity;

        // Iterate over the eight points of the OTHER prism
        for (var x_sign = -1; x_sign <= 1; x_sign += 2) {
            for (var y_sign = -1; y_sign <= 1; y_sign += 2) {
                for (var z_sign = -1; z_sign <= 1; z_sign += 2) {
                    // Get each point in THIS prism's frame of reference
                    var point_other = [
                        x_sign * other.r_x,
                        y_sign * other.r_y,
                        z_sign * other.r_z
                    ];
                    point_other = m4.apply_transform(point_other,
                        other.rotation_matrix);
                    point_other = v3.plus(point_other, relative_pos);
                    point_other = m4.apply_transform(point_other,
                        this.get_inv_rot());

                    // Update the observed max/mins
                    x_min = Math.min(point_other[0], x_min);
                    x_max = Math.max(point_other[0], x_max);
                    y_min = Math.min(point_other[1], y_min);
                    y_max = Math.max(point_other[1], y_max);
                    z_min = Math.min(point_other[2], z_min);
                    z_max = Math.max(point_other[2], z_max);
                }
            }
        }
        return (
               (x_min <= this.r_x && x_max >= -this.r_x)
            && (y_min <= this.r_y && y_max >= -this.r_y)
            && (z_min <= this.r_z && z_max >= -this.r_z)
        );
    }

    collides_prism(other) {
        //first, do (cheaper) spherical collision checks
        var dist = distance(this.pos, other.pos);
        if (dist > this.r_max + other.r_max) return false;
        else if (dist <= this.r_min + other.r_min) return true;

        //if it's between the two, we do the more expensive check
        else {
            return (this.collides_prism_sub(other) &&
                other.collides_prism_sub(this));
        }
    }
}

class ColliderMulti {
    //A collider made up of multiple components (assigned after instantiation.)
    //Note that components of a ColliderMulti will not be checked
    //for collision with one another.
    constructor() {
        this.components = [];
        this.collider_type = 'multi';
    }

    prep() {
        var sum_pos = [0, 0, 0];
        this.components.forEach(c => {
            c.prep();
            sum_pos = v3.plus(sum_pos, c.pos);
        });
        var nc = this.components.length;
        this.pos = [sum_pos[0]/nc, sum_pos[1]/nc, sum_pos[2]/nc];
    }

    collides(other) {
        for (var i = 0; i < this.components.length; i++) {
            if (this.components[i].collides(other)) return true;
        }
        return false;
    }
}

function collider_rmax(c) {
    switch (c.collider_type) {
        case 'multi':   return 10; //TODO: this is a hack
        case 'point':   return 0;
        case 'prism':   return c.r_max;
        case 'sphere':  return c.radius;
        default:        return 0;
    }
}

function cmp_collider(c1, c2) {
    // compare two objects based on their colliders' x coordinates (for sorting)
    return c1.collider.pos[0] - c2.collider.pos[0];
}


var collisions_checked;
function collision_check(c1, c2) {
    // check if the colliders are of the same group -
    // if so, collisions between them don't matter
    collisions_checked++;
    if (c1.collider.group && c2.collider.group
        && c1.collider.group == c2.collider.group) {
        return;
    }

    if (c1.collider.collides(c2.collider)) {
        c1.collider.has_collided = true;
        c2.collider.has_collided = true;
        /*
        console.log("collision:",
            c1.type, c1.collider.pos,
            c2.type, c2.collider.pos);
            */
        c1.collision_event(c2);
        c2.collision_event(c1);
    }
}

const collision_detection_span = 10;

function x_overlap(c1, c2) {
    var dist = Math.abs(c1.collider.pos[0] - c2.collider.pos[0]);
    // account for level wraparound
    dist = Math.min(dist, (level_bounds.x.max - level_bounds.x.min - dist));
    return dist <= collision_detection_span;
}

function resolve_collisions(all_colliders) {
    collisions_checked = 0;

    //preparatory calculations for all colliders
    all_colliders.forEach(c => {
        c.collider.prep();
    });

    // sort the list of colliders so we can walk through it linearly
    all_colliders.sort(cmp_collider);

    //collision check
    var i1; var i2;
    var c1; var c2;
    var min_x;

    for (i1 = 0; i1 < all_colliders.length; i1++) {
        c1 = all_colliders[i1];

        // check forward through collision list, wrapping around if needed
        i2 = (i1 + 1) % all_colliders.length;
        c2 = all_colliders[i2];
        while (i2 != i1 && x_overlap(c1, c2)) {
            collision_check(c1, all_colliders[i2]);
            i2++;
            i2 %= all_colliders.length;
            c2 = all_colliders[i2];
        }
    }
}
