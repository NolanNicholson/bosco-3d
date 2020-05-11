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
