class Player {
    constructor(program_holder) {
        this.program_holder = program_holder;
        this.ship_obj = new TexturedObj3D(program_holder,
            "models/player.obj", "models/player_tex.png");
    }

    update(dt) {
        this.ship_obj.update(dt);
    }

    render() {
        this.ship_obj.render();
    }
}
