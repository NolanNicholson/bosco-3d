class ColliderPoint {
    constructor(x, y, z) {
        this.pos = [x, y, z];
        this.collider_type = 'point';
    }

    collides(other) {
        return false;
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
        this.center = [x, y, z];
        this.radius = radius;
        this.collider_type = 'sphere';
    }

    collides_point(other) {
        return distance(this.center, other.pos) <= this.radius;
    }

    collides_sphere(other) {
        return distance(this.center, other.center) <= 
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
    }

    update_plane(p1, p2, p3) {
        this.p_ref = p1;
        var PQ = v3.minus(p1, p2);
        var PR = v3.minus(p1, p3);
        this.normal = v3.cross(PQ, PR);
    }

    collides_point(other) {
        return v3.dot(this.normal, v3.minus(other.pos, this.p_ref)) >= 0;
    }
}
