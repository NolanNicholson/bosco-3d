function createShader(gl, type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    var success = gl.getShaderParameter(shader, gl.COMPILE_STATUS);
    if (success) {
        return shader;
    } else {
        var typestr = type == gl.FRAGMENT_SHADER ? "FS" : "VS";
        console.error(typestr, gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
    }
}

//modified version of same-named function from webgl-utils.js; see:
//http://webgl2fundamentals.org/webgl/lessons/webgl-boilerplate.html
function resizeCanvasToDisplaySize(canvas, multiplier) {
    const dpr = window.devicePixelRatio;

    if (!multiplier) {
        var canv_size = Math.max(canvas.clientWidth, canvas.clientHeight) * dpr;
        multiplier = 1 / Math.max(1, Math.ceil(canv_size / 900));
    }

    const width  = canvas.clientWidth  * dpr * multiplier | 0;
    const height = canvas.clientHeight * dpr * multiplier | 0;
    if (canvas.width !== width ||  canvas.height !== height) {

        // update orientation if needed
        const ratio = width / height;
        if (ratio > 1.2) { // landscape
            main_view_sizer.id = "main-screen-landscape";
            canv_hud.id = "hud-landscape";
        } else { // portrait
            main_view_sizer.id = "main-screen-portrait";
            canv_hud.id = "hud-portrait";
        }

        canvas.width  = width;
        canvas.height = height;

        text_renderer.resize();

        return true;
    }
    return false;
}

function getMainViewport(canvas, sizer) {
    return [
        0,
        canvas.height * (1 - sizer.clientHeight / canvas.clientHeight),
        canvas.width / canvas.clientWidth * sizer.clientWidth,
        canvas.height / canvas.clientHeight * sizer.clientHeight
    ];
}

function createProgram(gl, vertexShader, fragmentShader) {
    var program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    var success = gl.getProgramParameter(program, gl.LINK_STATUS);
    if (success) {
        return program;
    } else {
        console.log(gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
    }
}

var v3 = {
    plus: function(a, b) {
        return [
            a[0] + b[0],
            a[1] + b[1],
            a[2] + b[2],
        ];
    },

    minus: function(a, b) {
        return [
            a[0] - b[0],
            a[1] - b[1],
            a[2] - b[2],
        ];
    },

    len_sq: function(a) {
        return (a[0] * a[0] + a[1] * a[1] + a[2] * a[2]);
    },

    divide: function(v, s) {
        return [ v[0]/s, v[1]/s, v[2]/s ];
    },

    normalize: function(v) {
        var length = Math.sqrt(v[0]*v[0] + v[1]*v[1] + v[2]*v[2]);
        if (length > 0.0001) {
            return v3.divide(v, length);
        } else {
            return [0, 0, 0];
        }
    },

    cross: function(a, b) {
        return [
            a[1] * b[2] - a[2] * b[1],
            a[2] * b[0] - a[0] * b[2],
            a[0] * b[1] - a[1] * b[0]
        ];
    },

    scalar_mult: function(v, s) {
        //multiply vector v by scalar s
        var result = []
        for (var i = 0; i < 3; i++) {
            result.push(v[i] * s);
        }
        return result;
    },
}

var m3 = {
    multiply: function(a, b) {
        var a00 = a[0 * 3 + 0];
        var a01 = a[0 * 3 + 1];
        var a02 = a[0 * 3 + 2];
        var a10 = a[1 * 3 + 0];
        var a11 = a[1 * 3 + 1];
        var a12 = a[1 * 3 + 2];
        var a20 = a[2 * 3 + 0];
        var a21 = a[2 * 3 + 1];
        var a22 = a[2 * 3 + 2];
        var b00 = b[0 * 3 + 0];
        var b01 = b[0 * 3 + 1];
        var b02 = b[0 * 3 + 2];
        var b10 = b[1 * 3 + 0];
        var b11 = b[1 * 3 + 1];
        var b12 = b[1 * 3 + 2];
        var b20 = b[2 * 3 + 0];
        var b21 = b[2 * 3 + 1];
        var b22 = b[2 * 3 + 2];

        return [
            b00 * a00 + b01 * a10 + b02 * a20,
            b00 * a01 + b01 * a11 + b02 * a21,
            b00 * a02 + b01 * a12 + b02 * a22,
            b10 * a00 + b11 * a10 + b12 * a20,
            b10 * a01 + b11 * a11 + b12 * a21,
            b10 * a02 + b11 * a12 + b12 * a22,
            b20 * a00 + b21 * a10 + b22 * a20,
            b20 * a01 + b21 * a11 + b22 * a21,
            b20 * a02 + b21 * a12 + b22 * a22,
        ];
    },

    identity: function() {
        return [
             1,  0,  0,
             0,  1,  0,
             0,  0,  1,
        ];
    },

    determinant: function(m) {
        var m00 = m[0];
        var m01 = m[1];
        var m02 = m[2];
        var m10 = m[3];
        var m11 = m[4];
        var m12 = m[5];
        var m20 = m[6];
        var m21 = m[7];
        var m22 = m[8];

        return (
              (m00 * m11 * m22)
            + (m01 * m12 * m20)
            + (m02 * m10 * m21)
            - (m02 * m11 * m20)
            - (m01 * m10 * m22)
            - (m00 * m12 * m21)
        );
    },

    translation: function(tx, ty) {
        return [
             1,  0,  0,
             0,  1,  0,
            tx, ty,  1,
        ];
    },

    rotation: function(angle_rad) {
        var c = Math.cos(angle_rad);
        var s = Math.sin(angle_rad);
        return [
             c, -s,  0,
             s,  c,  0,
             0,  0,  1,
        ];
    },

    scaling: function(sx, sy) {
        return [
            sx,  0,  0,
             0, sy,  0,
             0,  0,  1,
        ];
    },

    projection: function(w, h) {
        return [
            2/w,    0, 0,
              0, -2/h, 0,
             -1,    1, 1,
        ];
    },

    translate: function(m, tx, ty) {
        return m3.multiply(m, m3.translation(tx, ty));
    },

    rotate: function(m, angle_rad) {
        return m3.multiply(m, m3.rotation(angle_rad));
    },

    scale: function(m, sx, sy) {
        return m3.multiply(m, m3.scaling(sx, sy));
    },

    project: function(m, w, h) {
        return m3.multiply(m, m3.projection(w, h));
    },

};

var m4 = {
    multiply: function(a, b) {
        var a00 = a[0 * 4 + 0];
        var a01 = a[0 * 4 + 1];
        var a02 = a[0 * 4 + 2];
        var a03 = a[0 * 4 + 3];
        var a10 = a[1 * 4 + 0];
        var a11 = a[1 * 4 + 1];
        var a12 = a[1 * 4 + 2];
        var a13 = a[1 * 4 + 3];
        var a20 = a[2 * 4 + 0];
        var a21 = a[2 * 4 + 1];
        var a22 = a[2 * 4 + 2];
        var a23 = a[2 * 4 + 3];
        var a30 = a[3 * 4 + 0];
        var a31 = a[3 * 4 + 1];
        var a32 = a[3 * 4 + 2];
        var a33 = a[3 * 4 + 3];

        var b00 = b[0 * 4 + 0];
        var b01 = b[0 * 4 + 1];
        var b02 = b[0 * 4 + 2];
        var b03 = b[0 * 4 + 3];
        var b10 = b[1 * 4 + 0];
        var b11 = b[1 * 4 + 1];
        var b12 = b[1 * 4 + 2];
        var b13 = b[1 * 4 + 3];
        var b20 = b[2 * 4 + 0];
        var b21 = b[2 * 4 + 1];
        var b22 = b[2 * 4 + 2];
        var b23 = b[2 * 4 + 3];
        var b30 = b[3 * 4 + 0];
        var b31 = b[3 * 4 + 1];
        var b32 = b[3 * 4 + 2];
        var b33 = b[3 * 4 + 3];

        return [
            b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30,
            b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31,
            b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32,
            b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33,

            b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30,
            b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31,
            b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32,
            b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33,

            b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30,
            b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31,
            b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32,
            b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33,

            b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30,
            b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31,
            b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32,
            b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33,
        ];
    },

    apply_transform: function(v, m) {
        //applies a transform represented by the 4x4 matrix m
        //to the point represented by the 3x1 vector v
        return [
            v[0] * m[0] + v[1] * m[4] + v[2] * m[ 8] + m[12],
            v[0] * m[1] + v[1] * m[5] + v[2] * m[ 9] + m[13],
            v[0] * m[2] + v[1] * m[6] + v[2] * m[10] + m[14],
        ];
    },

    identity: function() {
        return [
             1,  0,  0,  0,
             0,  1,  0,  0,
             0,  0,  1,  0,
             0,  0,  0,  1,
        ];
    },

    determinant: function(m) {
        var m00 = m[ 0];
        var m01 = m[ 1];
        var m02 = m[ 2];
        var m03 = m[ 3];
        var m10 = m[ 4];
        var m11 = m[ 5];
        var m12 = m[ 6];
        var m13 = m[ 7];
        var m20 = m[ 8];
        var m21 = m[ 9];
        var m22 = m[10];
        var m23 = m[11];
        var m30 = m[12];
        var m31 = m[13];
        var m32 = m[14];
        var m33 = m[15];

        var det0 = m3.determinant([
            m11, m12, m13,
            m21, m22, m23,
            m31, m32, m33,
        ]);

        var det1 = m3.determinant([
            m01, m02, m03,
            m21, m22, m23,
            m31, m32, m33,
        ]);

        var det2 = m3.determinant([
            m01, m02, m03,
            m11, m12, m13,
            m31, m32, m33,
        ]);

        var det3 = m3.determinant([
            m01, m02, m03,
            m11, m12, m13,
            m21, m22, m23,
        ]);

        return (m00 * det0 - m10 * det1 + m20 * det2 - m30 * det3);
    },

    submat3: function(m, r_del, c_del) {
        // Returns a 3x3 submatrix obtained by
        // removing row r_del and colum c_del

        result = [];
        for (var i = 0; i < 16; i++) {
            if ((Math.floor(i / 4) != r_del) && (i % 4 != c_del)) {
                result.push(m[i]);
            }
        }
        return result;
    },

    transpose: function(m) {
        var m00 = m[ 0];
        var m01 = m[ 1];
        var m02 = m[ 2];
        var m03 = m[ 3];
        var m10 = m[ 4];
        var m11 = m[ 5];
        var m12 = m[ 6];
        var m13 = m[ 7];
        var m20 = m[ 8];
        var m21 = m[ 9];
        var m22 = m[10];
        var m23 = m[11];
        var m30 = m[12];
        var m31 = m[13];
        var m32 = m[14];
        var m33 = m[15];

        return [
            m00, m10, m20, m30,
            m01, m11, m21, m31,
            m02, m12, m22, m32,
            m03, m13, m23, m33,
        ];
    },

    adjugate: function(m) {
        var m00 = m[ 0];
        var m01 = m[ 1];
        var m02 = m[ 2];
        var m03 = m[ 3];
        var m10 = m[ 4];
        var m11 = m[ 5];
        var m12 = m[ 6];
        var m13 = m[ 7];
        var m20 = m[ 8];
        var m21 = m[ 9];
        var m22 = m[10];
        var m23 = m[11];
        var m30 = m[12];
        var m31 = m[13];
        var m32 = m[14];
        var m33 = m[15];

        // Determinants of submatrices
        var submat_det;
        var submat_dets = [];
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                submat_det = m3.determinant(m4.submat3(m, r, c));
                submat_dets.push(submat_det);
            }
        }

        var adjugate_mat = m4.transpose(submat_dets);
        var ind;
        for (var r = 0; r < 4; r++) {
            for (var c = 0; c < 4; c++) {
                ind = r * 4 + c;
                adjugate_mat[ind] = adjugate_mat[ind] * Math.pow(-1, r + c)
            }
        }

        return adjugate_mat;
    },

    scalar_mult: function(m, s) {
        //multiply matrix m by scalar s
        var result = []
        for (var i = 0; i < 16; i++) {
            result.push(m[i] * s);
        }
        return result;
    },

    inverse: function(m) {
        var det = m4.determinant(m); // reciprocal determinant
        var adj = m4.adjugate(m); // adjugate matrix
        
        return m4.scalar_mult(adj, 1 / det);
    },

    translation: function(tx, ty, tz) {
        return [
             1,  0,  0,  0,
             0,  1,  0,  0,
             0,  0,  1,  0,
            tx, ty, tz,  1,
        ];
    },

    rotation_x: function(angle_rad) {
        var c = Math.cos(angle_rad);
        var s = Math.sin(angle_rad);
        return [
             1,  0,  0,  0,
             0,  c,  s,  0,
             0, -s,  c,  0,
             0,  0,  0,  1,
        ];
    },

    rotation_y: function(angle_rad) {
        var c = Math.cos(angle_rad);
        var s = Math.sin(angle_rad);
        return [
             c,  0, -s,  0,
             0,  1,  0,  0,
             s,  0,  c,  0,
             0,  0,  0,  1,
        ];
    },

    rotation_z: function(angle_rad) {
        var c = Math.cos(angle_rad);
        var s = Math.sin(angle_rad);
        return [
             c,  s,  0,  0,
            -s,  c,  0,  0,
             0,  0,  1,  0,
             0,  0,  0,  1,
        ];
    },

    scaling: function(sx, sy, sz) {
        return [
            sx,  0,  0,  0,
             0, sy,  0,  0,
             0,  0, sz,  0,
             0,  0,  0,  1,
        ];
    },

    lookAt: function(camera, target, up) {
        //camera, target, up should all be arrays of length 3
        var z_axis = v3.normalize(
            v3.minus(camera, target));
        var x_axis = v3.normalize(v3.cross(up, z_axis));
        var y_axis = v3.normalize(v3.cross(z_axis, x_axis));

        return [
            x_axis[0], x_axis[1], x_axis[2], 0,
            y_axis[0], y_axis[1], y_axis[2], 0,
            z_axis[0], z_axis[1], z_axis[2], 0,
            camera[0], camera[1], camera[2], 1,
        ]
    },

    projection: function(w, h, d) {
        return [
            2/w,     0,   0, 0,
              0, - 2/h,   0, 0,
              0,     0, 2/d, 0,
             -1,     1,   0, 1,
        ];
    },

    orthographic: function(left, right, bottom, top, near, far) {
        return [
            2 / (right - left), 0, 0, 0,
            0, 2 / (top - bottom), 0, 0,
            0, 0, 2 / (near - far), 0,

            (left + right) / (left - right),
            (bottom + top) / (bottom - top),
            (near + far) / (near - far),
            1
        ];
    },

    perspective: function(fov_rad, aspect, near, far) {
        var f = Math.tan(Math.PI * 0.5 - 0.5 * fov_rad);
        var rangeInv = 1.0 / (near - far);
        return [
            f / aspect, 0, 0, 0,
            0, f, 0, 0,
            0, 0, (near + far) * rangeInv, -1,
            0, 0, near * far * rangeInv * 2, 0,
        ];
    },

    translate: function(m, tx, ty, tz) {
        return m4.multiply(m, m4.translation(tx, ty, tz));
    },

    rotate_x: function(m, angle_rad) {
        return m4.multiply(m, m4.rotation_x(angle_rad));
    },

    rotate_y: function(m, angle_rad) {
        return m4.multiply(m, m4.rotation_y(angle_rad));
    },

    rotate_z: function(m, angle_rad) {
        return m4.multiply(m, m4.rotation_z(angle_rad));
    },

    scale: function(m, sx, sy, sz) {
        return m4.multiply(m, m4.scaling(sx, sy, sz));
    },

    project: function(m, w, h, d) {
        return m4.multiply(m, m4.projection(w, h, d));
    },

};
