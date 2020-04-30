var audio_context;
window.addEventListener('load', init_audio, false);

function init_audio() {
    try {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        audio_context = new AudioContext();
        for (const sound_name in sounds) {
            sounds[sound_name].load();
        }
    } catch(e) {
        console.error("Error: Web Audio API not supported.");
    }
}

class Sound {
    constructor(path) {
        this.loaded = false;
        this.path = path;
    }

    load() {
        var me = this;
        fetch(this.path)
        .then(response => response.arrayBuffer())
        .then((data) => {
            audio_context.decodeAudioData(data,
                buffer => {
                    this.audio_buffer = buffer;
                    me.loaded = true;
                }, error => {
                    console.error(error);
                }
            );
        })
    }

    play() {
        if (!this.loaded) {
            console.error('Error: Attempting to play unloaded sound');
        } else {
            var source = audio_context.createBufferSource();
            source.buffer = this.audio_buffer;
            source.connect(audio_context.destination);
            source.start(0);
        }
    }
}

var sounds = {
    player_shoot:       new Sound('audio/shoot.wav'),
    base_cannon_hit:    new Sound('audio/cannon-hit.wav'),
    blast_off:          new Sound('audio/blast-off.wav'),
    e_type_hit:         new Sound('audio/e-type-hit.wav'),
    p_type_hit:         new Sound('audio/p-type-hit.wav'),
    i_type_spy_hit:     new Sound('audio/i-type-spy-hit.wav'),
    mine_hit:           new Sound('audio/boom.wav'),
};

