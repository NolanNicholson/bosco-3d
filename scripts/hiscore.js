// manage high scores with cookies

class HiScores {
    constructor() {
        // default names and high scores
        this.names =  [ "N.N", "A.A", "M.M", "C.C", "O.O" ];
        this.scores = [ 20000, 20000, 20000, 20000, 20000 ];
    }

    load() {
        // Load the high scores from a cookie
        // (if no cookie is present, the defaults in the constructor get used)
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

    push(name, score) {
        // don't do anything if it didn't make the high score
        if (score < this.scores[4]) return;

        // get ranking
        var index = 4;
        while (index > 0 && score > this.scores[index - 1]) index--;

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
hi_scores.load();
