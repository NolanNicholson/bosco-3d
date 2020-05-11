// List of all potential colliders
var all_colliders = [];

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

var base_data = [
    { x:   12, y: - 40, z:   10, rx: 0.75  },
    { x:   40, y:  200, z: - 40, rx: 0.125 },
    { x: -200, y: -100, z: -250, ry: 0.125 },
]

var bases = [];
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

function random_loc_in_level() {
    return [
        Math.random() * level_size.x + level_bounds.x.min,
        Math.random() * level_size.y + level_bounds.y.min,
        Math.random() * level_size.z + level_bounds.z.min
    ];
}

var asteroids = [];
var num_asteroids = 200;
for (var i = 0; i < num_asteroids; i++) {
    var scale = Math.random() * 8 + 1;
    var ast = new Asteroid(scale);
    [ast.x, ast.y, ast.z] = random_loc_in_level();
    asteroids.push(ast);
}

var mines = [];
var obj_mine;
var num_mines = 100;
var theta;
for (var i = 0; i < num_mines; i++) {
    obj_mine = new CosmoMine();
    [obj_mine.x, obj_mine.y, obj_mine.z] = random_loc_in_level();
    mines.push(obj_mine);
}

