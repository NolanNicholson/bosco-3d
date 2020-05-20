const canvas = document.getElementById("c");

const gl = canvas.getContext("webgl", {
    'antialias': false,
    'stencil': true,
} );
if (!gl) {
    console.warn("Error: WebGL not supported!");
}

const vao_ext = gl.getExtension("OES_vertex_array_object");
if (!vao_ext) {
    console.warn("Error: WebGL vertex array extension not available!");
}

var RENDER_COLLIDERS = false;
