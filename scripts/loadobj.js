//
//Loads a string in Wavefront .OBJ format and returns the model.
//This parser is originally based on material from 
// https://dannywoodz.wordpress.com
//but has been simplified by removing parsing of normals.
//
function loadOBJFromString(string, load_as_wireframe) {
    load_as_wireframe = load_as_wireframe || false;

    //Pre-format
    var lines = string.split("\n");
    var positions = [];
    var tex_positions = [];
    var vertices = [];
    var tex_vertices = [];

    var index_add_order;

    for (var i=0; i<lines.length; i++) {
        var parts = lines[i].trimRight().split(' ');
        if (parts.length > 0) {
            switch(parts[0]) {
                // 'v': vertex coordinates
                case 'v': positions.push(
                    [
                        parseFloat(parts[1]),
                        parseFloat(parts[2]),
                        parseFloat(parts[3])
                    ]);
                    break;
                // 'vt': texture coordinates
                case 'vt': tex_positions.push(
                    //TODO: why is the '1 - ' part necessary?
                    [
                        parseFloat(parts[1]),
                        1 - parseFloat(parts[2])
                    ]);
                    break;
                // 'f': face indices
                // (relies on all 'v', 'vt', and 'vn'
                //being parsed before any 'f')
                case 'f': {
                    // Each face has groups of
                    // 'v', 'vt' (texture), and 'vn' (normal) indices.
                    // For now, this only pulls the 'v' ones.
                    var v_indices = [];
                    var vt_indices = [];
                    for (var j = 1; j < parts.length; j++) {
                        var part = parts[j].split('/');
                        v_indices.push(parseInt(part[0]));
                        if (part.length > 1)
                            vt_indices.push(parseInt(part[1]));
                    }

                    // Determine the indices with which to pull in
                    // vertices from the 'v' and 'vt' coordinates.
                    // Depends on the number of vertices in the face, and
                    // on whether or not the model is loaded as a wireframe
                    if (load_as_wireframe) {
                        if (v_indices.length > 3) {
                            index_add_order = [0, 1, 1, 2, 2, 3, 3, 0];
                        } else {
                            index_add_order = [0, 1, 1, 2, 2, 0];
                        }
                    } else {
                        if (v_indices.length > 3) {
                            // If the face has a fourth index,
                            // add a second triangle
                            index_add_order = [0, 1, 2, 0, 2, 3];
                        } else {
                            index_add_order = [0, 1, 2];
                        }
                    }

                    index_add_order.forEach(function(j) {
                        //push vertex coordinates
                        vertices.push(...positions[v_indices[j] - 1]);
                        //push texture coordinates if they are present
                        if (vt_indices.length)
                            tex_vertices.push(
                                ...tex_positions[vt_indices[j] - 1]);
                    });
                    break;
                }
            }
        }
    }
    return {
        vertices: vertices,
        tex_vertices: tex_vertices,
        vertexCount: vertices.length / 3
    };
}

//
//Fetches a string by ID from an iframe.
//Requires that the iframe be fully loaded first!
//
function getStringFromIFrameID(ID) {
    var frame = document.getElementById(ID);
    var string = frame.contentWindow.document.body.childNodes[0].innerHTML;
    return string;
}

//
//Fetches a string using Fetch.
//
function getStringFromFetch(url) {
    fetch(url)
    .then(response => response.text())
    .then((data) => {
        return data;
    })
}
