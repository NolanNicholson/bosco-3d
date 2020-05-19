function add_to_score(amt) {
    var new_score = score + amt;

    var got_life = (
        (new_score >= 10000 && score < 10000) ||
        (Math.floor(new_score / 50000) - Math.floor(score / 50000))
    );

    if (got_life) {
        if (lives < 4) {
            sounds.extra_life.play();
            lives++;
        }
    }

    score += amt;
}

// manage high scores with cookies
class HiScores {
    constructor() {
        // default names and high scores
        this.names =  [ "N.N", "A.A", "M.M", "C.C", "O.O" ];
        this.scores = [ 20000, 20000, 20000, 20000, 20000 ];
    }

    load() {
        // Load the high scores from a cookie

        // If no cookie is present, the defaults in the constructor get used.
        if (!document.cookie.length) return;

        var cookies = unescape(document.cookie).split(';');
        for (var i = 0; i < cookies.length; i++) {
            // decode the individual cookies
            var cookie = cookies[i];
            if (cookie.charAt(0) == ' ') {
                cookie = cookie.substring(1, cookie.length);
            }
            var key; var value;
            [key, value] = cookie.split('=');

            // the value is a list of strings or numbers
            value = value.split(',');
            
            switch(key) {
                case 'hiscorenames': this.names = value; break;
                case 'hiscores':
                    var nums = [];
                    value.forEach(num_str => {
                        nums.push(Number(num_str));
                    });
                    this.scores = nums; break;
            }
        }
    }

    get_ranking(score) {
        // get ranking of a score compared with current scores
        var index = 4;
        while (index > 0 && score > this.scores[index - 1]) index--;
        return index;
    }

    push(name, score) {
        // don't do anything if it didn't make the high score
        if (score < this.scores[4]) return;

        var index = this.get_ranking(score);
        this.names = this.names.slice(0, index).concat(
            name, this.names.slice(index, 4));
        this.scores = this.scores.slice(0, index).concat(
            score, this.scores.slice(index, 4));

        this.save();
    }

    save() {
        var d = new Date();
        d.setDate(d.getDate() + 30); // cookie expires after 30 days
        var expires = "; expires=" + d.toUTCString();

        document.cookie = "hiscorenames=" + this.names.join(',') + expires;
        document.cookie = "hiscores=" + this.scores.join(',') + expires;
    }
}

var hi_scores = new HiScores();
//hi_scores.save(); // this line clears the hi-scores to their default values
hi_scores.load();
