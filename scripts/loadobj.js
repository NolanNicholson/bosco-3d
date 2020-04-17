//
//Loads a string in Wavefront .OBJ format and returns the model.
//This parser is originally based on material from 
// https://dannywoodz.wordpress.com
//but has been simplified by removing parsing of normals.
//
function loadOBJFromString(string) {

    //Pre-format
    var lines = string.split("\n");
    var positions = [];
    var vertices = [];

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
                // 'f': face indices
                // (relies on all 'v' being parsed before any 'f')
                case 'f': {
                    // Each face has groups of
                    // v, vt (texture), and vn (normal) indices.
                    // For now, this only pulls the 'v' ones.
                    var v_indices = [];
                    for (var j = 1; j < parts.length; j++) {
                        var part = parts[j].split('/');
                        v_indices.push(parseInt(part[0]));
                    }
                    // add the first triangle of the face
                    for (var j=0; j<3; j++) {
                        vertices.push(...positions[v_indices[j] - 1]);
                    }
                    // If the face has a fourth index, add a second triangle
                    if (v_indices.length > 3) {
                        vertices.push(...positions[v_indices[0] - 1]);
                        vertices.push(...positions[v_indices[2] - 1]);
                        vertices.push(...positions[v_indices[3] - 1]);
                    }
                    break;
                }
            }
        }
    }
    return {
        vertices: new Float32Array(vertices),
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
        console.log(data)
        return data;
    })
}
