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

const LEVELS = [
    { // ROUND 1: Close triangle
        player_start: [0, 0, 100],
        bases: [
            { x:   20, y: -140, z:   10, rx: 0.75  },
            { x:   40, y:   40, z: - 40, rx: 0.3   },
            { x: -100, y: -100, z: -150, rz: 0.125 },
        ],
    },
    { // ROUND 2: Two pairs
        player_start: [0, 0, 0],
        bases: [
            { x:  200, y: - 60, z:    0 },
            { x:  200, y:   60, z:    0 },
            { x: -200, y:    0, z: - 60 },
            { x: -200, y:    0, z:   60 },
        ],
    },
    { // ROUND 3: A tight circle
        player_start: [0, 0, 0],
        bases: [
            { x:   75, y: - 63, z:   22, rx: 0.5 },
            { x:   88, y:    9, z:   46 },
            { x:   50, y:   75, z:   43, rx: 0.5 },
            { x: - 18, y:   97, z:   15 },
            { x: - 75, y:   63, z: - 22, rx: 0.5 },
            { x: - 88, y: -  9, z: - 46 },
            { x: - 50, y: - 75, z: - 43, rx: 0.5 },
            { x:   18, y: - 97, z: - 15 },
        ],
    },
    { // ROUND 4: Orion
        player_start: [0, 50, -50],
        bases: [
            { x: -200, y:  250, z:  100, rx: 0.75  }, // TL / Betelg./ 643 ly
            { x: -170, y: -280, z:   50, rz: 0.3   }, // BL / Saiph  / 724 ly
            { x:  150, y:  200, z:  200, rx: 0.125 }, // TR / Belatx./ 243 ly
            { x:  170, y: -240, z: - 50, rz: 0.3   }, // BR / Rigel  / 860 ly
            { x:   70, y: - 26, z: - 50, rz: 0.3   }, // MR / Mntaka./ 900 ly
            { x:    0, y: - 43, z: -150, rz: 0.3   }, // MM / Alnilm./ 1359 ly
            { x: - 50, y: - 60, z: -  0, rz: 0.3   }, // ML / Alnitk./ 800 ly
            { x:    0, y: -150, z: -250, rx: 0.75  }, // SW / Nebula / 1600 ly
        ],
    },
    { // ROUND 5: Spiral (was circle in the original)
        player_start: [0, 0, 0],
        bases: [
            { x: 200,  y: 0,    z: -275, rx: 0.1 },
            { x: 141,  y: 141,  z: -200, rx: 0.1 },
            { x: 0,    y: 200,  z: -125, rx: 0.1 },
            { x: -142, y: 141,  z: -50,  rx: 0.4 },
            { x: -200, y: 0,    z: 25,   rx: 0.5 },
            { x: -142, y: -142, z: 100,  rx: 0 },
            { x: -1,   y: -200, z: 175,  rx: 0.9 },
            { x: 141,  y: -142, z: 250,  rx: 0.4 },
        ]
    },
    { // ROUND 6: Big squiggle
        player_start: [0, 0, 0],
        bases: [
            { x: -250, y:  250, z: -200, rx: 0.4 },
            { x:   50, y:  200, z: -100, rz: 0.7 },
            { x:  200, y:  170, z:    0, rx: 0.4 },
            { x:  200, y:  100, z:  100, rz: 0.2 },
            { x:  100, y:   50, z:  200, rx: 0.1 },
            { x:    0, y:  -50, z:   50, rz: 0.9 },
            { x: -100, y: -150, z: -100, rx: 0.8 },
            { x:    0, y: -250, z:    0, rz: 0.4 },
        ],
    },
    { // ROUND 7: Straight line
        player_start: [0, -100, 200],
        bases: [
            { x: -275, y:    0, z:    0, rx: 0.5, rz: 0.5 },
            { x: -200, y:    0, z:    0, rx: 0.5, rz: 0.5 },
            { x: -125, y:    0, z:    0, rx: 0.5, rz: 0.5 },
            { x: - 50, y:    0, z:    0, rx: 0.5, rz: 0.5 },
            { x:   25, y:    0, z:    0, rx: 0.5, rz: 0.5 },
            { x:  100, y:    0, z:    0, rx: 0.5, rz: 0.5 },
            { x:  175, y:    0, z:    0, rx: 0.5, rz: 0.5 },
            { x:  250, y:    0, z:    0, rx: 0.5, rz: 0.5 },
        ],
    },
    { // ROUND 8: Tight cluster
        player_start: [0, 0, 0],
        bases: [
            { x:   20, y:   20, z: - 20, rz: 0.2 },
            { x:   30, y:   30, z: - 70, rz: 0.2 },
            { x: - 40, y:   20, z: - 60, rx: 0.8 },
            { x: - 50, y:   30, z: - 70, rx: 0.8 },
            { x: - 50, y:  -30, z:   70, rx: 0.3 },
            { x: - 10, y:  -30, z:   40, rx: 0.6 },
            { x:   30, y:  -30, z:   70, rx: 0.6 },
            { x: - 20, y:  -30, z: - 40, rx: 0.5 },
        ],
    },
    { // ROUND 9: Sector X
        player_start: [0, 0, 0],
        bases: [
            { x:    0, y:   75, z:   75, rx: 0.1  },
            { x:    0, y:  200, z:  200, rx: 0.2  },
            { x:    0, y: - 75, z:   75, rx: 0.3  },
            { x:    0, y: -200, z:  200, rx: 0.4  },
            { x:    0, y:   75, z: - 75, rx: 0.5  },
            { x:    0, y:  200, z: -200, rx: 0.6  },
            { x:    0, y: - 75, z: - 75, rx: 0.7  },
            { x:    0, y: -200, z: -200, rx: 0.8  },
        ],
    },
    { // ROUND 10: Sector Y
        player_start: [0, 0, 200],
        bases: [
            { x:    0, y:    0, z:  160, rx: 0.5 },
            { x:    0, y:    0, z:  110, rx: 0.0 },
            { x:    0, y:    0, z:   60, rx: 0.5 },
            { x:    0, y:    0, z:   10, rx: 0.0 },
            { x: - 75, y:    0, z: - 65, rx: 0.25, rz: -0.5 },
            { x:   75, y:    0, z: - 65, rx: 0.25, rz:  0.5 },
            { x: -150, y:    0, z: -140, rx: 0.25, rz: -0.5 },
            { x:  150, y:    0, z: -140, rx: 0.25, rz:  0.5 },
        ],
    },
    { // ROUND 11: Sector Z
        player_start: [0, 0, 0],
        bases: [
            { x:   50, y:   50, z:    0, rx: 0.75  },
            { x: - 50, y: - 50, z:    0, rx: 0.75  },
            { x:  150, y:  150, z:    0, rx: 0.75  },
            { x:    0, y:  150, z:    0, rx: 0.75  },
            { x: -150, y:  150, z:    0, rx: 0.75  },
            { x:  150, y: -150, z:    0, rx: 0.75  },
            { x:    0, y: -150, z:    0, rx: 0.75  },
            { x: -150, y: -150, z:    0, rx: 0.75  },
        ],
    },
    { // ROUND 14: Clusters
        player_start: [0, 0, 250],
        bases: [
            { x: -200, y: -100, z:  200, rx: 0.75 },
            { x: - 50, y:    0, z:  100, rx: 0 },
            { x: - 50, y:   30, z:  100, rx: 1 },
            { x:   50, y: - 50, z:   50, rx: 0.5, rz:  0.5  },
            { x:   80, y: - 50, z:   50, rx: 0.5, rz: -0.5  },
            { x:  140, y:  180, z:  -50, rx: 0.5, rz:  0.5  },
            { x:  110, y:  180, z:  -50, rx: 0.5, rz: -0.5  },
            { x:  140, y:  150, z:  -50, rx: 0 },
        ],
    },
    { // ROUND 15: "A" shape
        player_start: [0, 0, 200],
        bases: [
            { x: -250, y:   40, z:  100, rx: 0.3   },
            { x:   50, y:    0, z:    0, rz: 0.125 },
            { x: -150, y: -150, z: - 20, rz: 0.125 },
            { x: - 50, y: -100, z: -120, rx: 0.3 },
            { x:    0, y: - 50, z: -220, rz: 0.125 },

            { x:  200, y:  200, z:  200, rx: 0.75  },
            { x: - 20, y:  150, z: - 50, rx: 0.75  },
            { x:  100, y:   50, z: -100, rx: 0.75  },
        ],
    },
    { // ROUND 17: Question mark
        player_start: [0, -250, 250],
        bases: [
            { x: - 75, y:  200, z:    0, rx: 0.75  },
            { x:   50, y:  230, z: -200, rx: 0.75  },
            { x: -150, y:  125, z:    0, rx: 0.75  },
            { x:  125, y:  125, z:    0, rx: 0.75  },
            { x:  100, y:   25, z:    0, rx: 0.75  },
            { x:   50, y: - 50, z:    0, rx: 0.75  },
            { x:    0, y: -150, z: -200, rx: 0.75  },
            { x:    0, y: -200, z:    0, rx: 0.75  },
        ],
    },
]

var player_start_position;
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
    var level_no;

    // sequence by which levels repeat starting when round = 11
    const repeating_seq = [2, 3, 11, 12, 4, 13];

    if (round < 11) level_no = round;
    else level_no = repeating_seq[(round - 11) % 6];
    var level_data = LEVELS[level_no];

    player_start_position = level_data.player_start;

    // reset the list of colliders to just the player
    // (subsequent objects will add themselves in their constructors)
    all_colliders = [player];

    bases = [];
    var base_data = level_data.bases;
    base_data.forEach(base_params => {
        var new_b = new EnemyBase();
        new_b.scale = 4;
        new_b.x = base_params.x;
        new_b.y = base_params.y;
        new_b.z = base_params.z;
        if (base_params.rx)
            new_b.rotation_matrix = m4.rotation_x(Math.PI * base_params.rx);
        if (base_params.rz)
            new_b.rotation_matrix = m4.rotation_z(Math.PI * base_params.rz);
        bases.push(new_b);

        // initial sync of base's parts
        new_b.update(0);
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

    if (round == 0) {
        player_ready_screen.begin_game();
    } else {
        player_ready_screen.begin_level();
    }
}
