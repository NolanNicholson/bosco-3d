const canvas = document.getElementById("c");

const gl = canvas.getContext("webgl2", {
    'antialias': false,
    'stencil': true,
} );
if (!gl) {
    console.log("WebGL 2 not supported!");
}

var RENDER_COLLIDERS = false;
