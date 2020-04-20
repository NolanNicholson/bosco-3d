// Assets
// Handles loading of models and textures from external files

class Texture {
    constructor(filename) {
        //Initialize the texture with a placeholder
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA,
            gl.UNSIGNED_BYTE,
            new Uint8Array([0, 0, 255, 255]));

        //Asynchronously load the real texture
        var image = new Image();
        image.src = filename;
        var me = this;
        image.addEventListener('load', function() {
            gl.bindTexture(gl.TEXTURE_2D, me.texture);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE,
                image);
            //set texture parameters
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
            //generate mipmap
            gl.generateMipmap(gl.TEXTURE_2D);
        });
    }
}

class Model {
    constructor(filename) {
    }
}
