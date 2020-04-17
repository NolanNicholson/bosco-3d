class TexturedObj3D extends Obj3D {
    constructor(obj_filename) {
        super([], []);
        var me = this;

        //test coords - TODO: remove
        this.scale = 0.5;
        this.x = 2;
        this.y = 2;
        this.z = 2;

        fetch(obj_filename)
        .then(response => response.text())
        .then((obj_string) => {
            var obj_file = loadOBJFromString(obj_string);
            console.log(obj_file);

            var positions = obj_file.vertices;
            var colors = [];
            for (var i = 0; i < positions.length / 3; i++) {
                colors.push(1.0, 0.7, 1.0);
            }

            me.load_data(positions, colors);
        });
    }

    update(dt) {
    }
}
