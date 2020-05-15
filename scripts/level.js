// Level boundaries (beyond which everything wraps over)
var level_bounds = {
    x: { min: -300, max: 300 },
    y: { min: -300, max: 300 },
    z: { min: -300, max: 300 },
};
var level_size = {
    x: level_bounds.x.max - level_bounds.x.min,
    y: level_bounds.y.max - level_bounds.y.min,
    z: level_bounds.z.max - level_bounds.z.min,
}

function random_loc_in_level() {
    var margin = 10;
    var loc = [
        Math.random() * (level_size.x - 2*margin) + level_bounds.x.min + margin,
        Math.random() * (level_size.y - 2*margin) + level_bounds.y.min + margin,
        Math.random() * (level_size.z - 2*margin) + level_bounds.z.min + margin,
    ];
    return loc;
}

var base_data = [
    { x:   12, y: - 40, z:   10, rx: 0.75  },
    { x:   40, y:  200, z: - 40, rx: 0.125 },
    { x: -200, y: -100, z: -250, ry: 0.125 },
]
var player_start_position = [200, 4, 50];

var bases;
var objects; // list of all objects which need to update and render
var all_colliders = []; // list of all objects which process collision detection

// Objects which persist across levels
var player = new Player();
var obj_starfield = new Starfield();    // starfield background object

function too_close(obj, other, sq_radius) {
    var rel = obj.get_rel_to(other.x, other.y, other.z);
    var sqdist = v3.len_sq(rel);
    return (sqdist < sq_radius);
}

function too_close_bases_player(obj) {
    // check bases
    for (var i = 0; i < bases.length; i++) {
        var base = bases[i];
        if (too_close(obj, base, base.scale * base.scale * 100)) {
            return true;
        }
    }
    // check player
    if (too_close(obj, player, 1000)) return true;
    // OK
    return false;
}

function collides_with_placed_objs(obj, placed_objs) {
    for (var i = 0; i < placed_objs.length; i++) {
        var other = placed_objs[i];
        if (obj.collider.collides(other.collider)) return true;
    }
    return false;
}

function place_obj(obj, placed_objs) {
    do {
        [obj.x, obj.y, obj.z] = random_loc_in_level();
        obj.sync_collider();
    } while (collides_with_placed_objs(obj, placed_objs)
        || too_close_bases_player(obj));
    placed_objs.push(obj);
    objects.push(obj);
}



function load_level() {
    [player.x, player.y, player.z] = player_start_position;

    // reset the list of colliders to just the player
    // (subsequent objects will add themselves in their constructors)
    all_colliders = [player];

    bases = [];
    base_data.forEach(base_params => {
        var new_b = new EnemyBase();
        new_b.scale = 4;
        new_b.x = base_params.x;
        new_b.y = base_params.y;
        new_b.z = base_params.z;
        if (base_params.rx)
            new_b.rotation_matrix = m4.rotation_x(Math.PI * base_params.rx);
        if (base_params.ry)
            new_b.rotation_matrix = m4.rotation_y(Math.PI * base_params.ry);
        bases.push(new_b);
    });

    objects = [
        player, obj_starfield,
        ...bases,
    ];

    var placed_objs = [];

    var num_asteroids = 200;
    for (var i = 0; i < num_asteroids; i++) {
        var scale = Math.random() * 8 + 1;
        var ast = new Asteroid(scale);
        place_obj(ast, placed_objs);
    }

    var num_mines = 100;
    for (var i = 0; i < num_mines; i++) {
        var obj_mine = new CosmoMine();
        place_obj(obj_mine, placed_objs);
    }

    player.spawn();
}
