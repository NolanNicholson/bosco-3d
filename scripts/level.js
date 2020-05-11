// List of all potential colliders
var all_colliders = [];

// Level boundaries (beyond which everything wraps over)
var level_bounds = {
    x: { min: -300, max: 300 },
    y: { min: -300, max: 300 },
    z: { min: -300, max: 300 },
};

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

var asteroids = [];
for (var i = 0; i < 10; i++) {
    var ast = new Asteroid();
    ast.x = Math.random() * 40 - 40;
    ast.y = Math.random() * 40 - 40;
    ast.z = Math.random() * 40 - 40;
    asteroids.push(ast);
}

var mines = [];
var obj_mine;
var num_mines = 12;
var theta;
for (var i = 0; i < num_mines; i++) {
    obj_mine = new CosmoMine();
    theta = i / num_mines * 2 * Math.PI;
    obj_mine.x = 40;
    obj_mine.z = Math.cos(theta) * 20;
    obj_mine.y = Math.sin(theta) * 20;
    mines.push(obj_mine);
}

// Define some more test objects, in the shape of a formation
// TODO: remove when actual formations are implemented
var formation = [
    new ObjTexture(models.enemy_p, textures.enemy_p_alt),
    new ObjTexture(models.enemy_p, textures.enemy_p),
    new ObjTexture(models.enemy_p, textures.enemy_p),
    new ObjTexture(models.enemy_p, textures.enemy_p),
    new ObjTexture(models.enemy_p, textures.enemy_p),
]
formation[0].x = -10; // center
formation[1].x = -10; // front
formation[2].x = -10; // back
formation[3].x = -07; // left
formation[4].x = -13; // right

formation[0].z = -10; // center
formation[1].z = -07; // front
formation[2].z = -13; // back
formation[3].z = -10; // left
formation[4].z = -10; // right

