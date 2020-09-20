//==========Classes=========//

class PvpCandidate {
    constructor(League = "Great") {
        this.name = p.pvPoke[League].name;
        if (League == "Great") {
            this.rank = p.min_pvpRankGreat;
            this.badge = (this.rank <= 200) ? "Ⓖ" : "ⓖ";
            this.CPLim = 1500;
        } else {
            this.rank = p.min_pvpRankUltra;
            this.badge = (this.rank <= 200) ? "Ⓤ" : "ⓤ";
            this.CPLim = 2500;
        }
        this.IV = pvpIVCalc(this.rank);
        this.IV2 = numFormat(this.IV, 2, "Trunc");
        this.IV0 = numFormat(this.IV, 0, "Trunc");

        let last = pvPokeDB[League].score.length - 1;
        let scoreEff = (p.pvPoke[League].score - pvPokeDB[League].score[last]) / (pvPokeDB[League].score[0] - pvPokeDB[League].score[last]) * 100;

        this.IVEff = this.IV + scoreEff - 100;
        if (p.pvPoke[League].candidate) {
            p.pvpLeagueNum += Math.trunc(this.CPLim / 1e3);
        }
    }
}

class PvPokeCandidate {
    constructor(League) {
        this.League = League;
        if (League == "Great") {
            this.badge = "🄶";
            this.name = (typeof p.evo_pvpRankGreat !== 'undefined') ? p.evo_pvpRankGreat : p.name;
        } else {
            this.name = (typeof p.evo_pvpRankUltra !== 'undefined') ? p.evo_pvpRankUltra : p.name;
            if (League == "Ultra") {
                this.badge = "🅄";
            } else if (League == "Master") {
                this.badge = "🄼";
            } else if (League == "Premier") {
                this.badge = "🄿";
            }
        }
        this.rank = pvPokeDB[League].name.indexOf(sanitize(this.name).toString()) + 1;
        if (this.rank == 0) {
            this.rank = NaN;
        }
        this.score = pvPokeDB[League].score[this.rank - 1];
        this.candidate = (this.score > 78);
    }
    print(showName) {
        let shadowStr = '';
        if (this.name.includes('Sombra')) {
            let rank = pvPokeDB[this.League].name.indexOf(sanitize(this.name.replace(/ Sombra/, ''))) + 1;
            if (this.rank == 0) {
                this.rank = NaN;
            }
            shadowStr = '(#' + rank.toString() + ')';
        }
        pvPokeDisplay += ((showName) ? this.name + "<br>" : '') + "<b>" + this.badge + "</b>" + "<b>#" + this.rank.toString() + shadowStr + "</b>(" + numFormat(this.score, 2) + ")";
        if (typeof p.pvp !== 'undefined' && (this.League == 'Great' || this.League == 'Ultra')) {
            pvPokeDisplay += "<b>IV:</b>" + p.pvp[this.League].IV2;
        }
    }
}

class BestPokemon {
    constructor() {
        this.name = new Object();
        this.rawStats = new Object();
        this.stats = new Object();
        for (let group of ['iv'].concat(Object.keys(p.pvPoke))) {
            if (group == 'Master' || group == 'Premier') {
                break;
            }
            this.name[group] = (group == 'iv') ? p.name : p.pvPoke[group].name;
            this.rawStats[group] = bestPokeDB[group][sanitize(this.name[group])];
            this.stats[group] = (group == 'iv') ? this.rawStats[group] : numFormat(pvpIVCalc(this.rawStats[group]), 2, "Trunc");
        }
    }
    print(type = 'Best') {
        let cpString = '';
        let display = '';
        //console.log(p.max_cp)
        if (p.unique_combination || type == 'Best') {
            for (let group in this.stats) {
                let value = '';
                let prefix = (group == 'iv') ? '<b>IV:</b>' : p.pvPoke[group].badge;
                if (type == 'Best') {
                    value = this.stats[group];
                } else if (p.unique_combination) {
                    let pokeIV = (group == 'iv') ? p.iv : p.pvp[group].IV2;
                    if (pokeIV < this.stats[group]) {
                        value = pokeIV;
                    } else if (group == 'iv') {
                        prefix = '👑';
                    }
                }
                if ((group == 'Ultra' && p.max_cp < 2500) || (group == 'Great' && p.max_cp < 1500) || p.max_cp > 2500) {
                    cpString = '<b>CP:</b>' + p.max_cp + ' ';
                }
                if (group == 'iv') {
                    display += (type != 'Best') ? '' : '<br>';
                    display += prefix + value;
                } else if (p.pvPoke[group].candidate) {
                    display += '<br>' + prefix + value;
                }
            }
        }
        console.log(((type == 'Best') ? '<b>Best</b>' : cpString) + display);
        return ((type == 'Best') ? '<b>Best</b>' : cpString) + display;
    }
    update() {
        let rewrite = false;
        let medals = false;
        for (let group in this.stats) {
            let pokeIV = (group == 'iv') ? p.iv : p.pvp[group].IV2;
            if (pokeIV == this.stats[group]) {
                medals = true;
            }
            if (pokeIV > this.stats[group] || typeof (this.rawStats[group]) === 'undefined') {
                this.rawStats[group] = (group == 'iv') ? p.iv : p.pvp[group].rank;
                this.stats[group] = pokeIV;
                rewrite = true;
                //==========UpdateDB==========//
                bestPokeDB[group][sanitize(this.name[group])] = this.rawStats[group];
            }
        }
        if (medals && !rewrite && p.pvpLeagueNum > 0) {
            vibratePattern('100,300,100,300');
        } else if (rewrite) {
            vibratePattern('100,1000,100,1000,100,1000');
            //==========WriteDB==========//
            if (global("%SaveDB") != -1) {
                writeFile(pokeBestDBFile, JSON.stringify(bestPokeDB));
            }
        }
        //console.log(this);
    }
}

//==========Compatibility=========//
try {
    var fs = require("fs");

    function readFile(file) {
        return fs.readFileSync('.' + file.match(/\/.+/g), 'utf8');
    }

    function writeFile(file, content) {
        fs.writeFile('.' + file.match(/\/.+/g), content, 'utf8', function (err) {
            if (err) {
                console.log("An error occured while writing JSON Object to File.");
                return console.log(err);
            }
            console.log(file + " has been saved.");
        });
    }

    eval.apply(global, [fs.readFileSync('calcy_external.js').toString()]);
} catch (e) {}


//==========Main=========//
try {
    //==========Custom configs==========//
    var pokeBestDBFile = (global('%DBprimaria') == 1) ? 'TaskerJS/newDB.json' : 'TaskerJS/newDB_sec.json';
    //==========Begining==========//

    hideScene("CalcyAlertCopy");

    var p = JSON.parse(tesmath_calcy_data); //Get pokemon data
    p.iv = Math.round(100 * p.min_iv);

    // Initializing displaying atributes
    var n = {
        name: p.name,
        pvpIV: "",
        ivs: "",
        iv: convertToSuperscript(p.iv),
        legacy: p.legacy_move ? "˙" : ".",
        badge: "",
        medals: ""
    };
    var out = 'Avalie';

    //=========pvPoke System========//
    var pvPokeDB = JSON.parse(readFile("TaskerJS/pvPokeDB.json"));
    var pvPokeDisplay = "";

    p.pvPoke = new Object();

    if (typeof p.min_pvpRankGreat !== 'undefined') {
        p.pvPoke["Great"] = new PvPokeCandidate("Great");
    }
    if (typeof p.min_pvpRankUltra !== 'undefined') {
        p.pvPoke["Ultra"] = new PvPokeCandidate("Ultra");
    }
    if (p.nickname.includes("©")) {
        p.max_cp = p.nickname.match(/\d+(?!©)/g);
    }
    if (p.max_cp > 2500) {
        // if (pvPokeDB["Premier"].name.includes(sanitize((typeof p.evo_pvpRankUltra !== 'undefined') ? p.evo_pvpRankUltra : p.name))) {
        //     p.pvPoke["Premier"] = new PvPokeCandidate("Premier");
        // }
        p.pvPoke["Master"] = new PvPokeCandidate("Master");
    }

    //==========Best System==========//
    var bestPokeDB = JSON.parse(readFile(pokeBestDBFile));

    p.pokeBest = new BestPokemon();

    //==========After Appraisal==========//
    if (p.unique_combination) {
        //======PVP======//
        p.pvpLeagueNum = 0;
        // Creating PvP Candidates
        p.pvp = new Object();
        if (typeof p.min_pvpRankGreat !== 'undefined') {
            p.pvp["Great"] = new PvpCandidate("Great");
        }
        if (typeof p.min_pvpRankUltra !== 'undefined') {
            p.pvp["Ultra"] = new PvpCandidate("Ultra");
        }

        //======Best Pokemon======//
        p.pokeBest.update();
        setGlobal('%Calcy_medals', p.pokeBest.print("You"));


        //======Naming sub-strings======//
        if (p.max_iv < 1) { //<100% IV naming system
            // Get best PvP Candidate
            if (p.pvpLeagueNum > 0) {
                switch (p.pvpLeagueNum) {
                    case 3:
                        p.league = (p.pvp.Great.IVEff > p.pvp.Ultra.IVEff) ? "Great" : "Ultra";
                        break;
                    case 2:
                        p.league = "Ultra";
                        break;
                    case 1:
                        p.league = "Great";
                }
                // Pvp sub-strings
                n.name = p.pvp[p.league].name;
                n.badge = p.pvp[p.league].badge;
                if (p.max_cp > p.pvp[p.league].CPLim) {
                    n.pvpIV = p.pvp[p.league].IV0;
                }
            }
            //ivs sub-string
            var ivNumbers = ['⓪', '①', '②', '③', '④', '⑤', '⑥', '⑦', '⑧', '⑨', '⑩', '⑪', '⑫', '⑬', '⓮', '⓯'];
            n.ivs = ivNumbers[p.att_iv] + ivNumbers[p.def_iv] + ivNumbers[p.sta_iv];
        } else { //100% ivs sub-strings
            if (typeof p.evo_pvpRankUltra !== 'undefined') {
                n.name = p.evo_pvpRankUltra;
            } else if (typeof p.evo_pvpRankGreat !== 'undefined') {
                n.name = p.evo_pvpRankGreat;
            }
        }
        n.append = n.legacy + n.badge + n.ivs + n.iv + n.pvpIV;
        out = n.legacy + n.badge + fitName() + n.ivs + n.iv + n.pvpIV;
        setClip(out);
        // console.log(calcSizeDetailed(out));
    } else {
        setClip(' ');
        setGlobal('%Calcy_medals', '🤔?');
    }

    setGlobal("%Calcy_alert", out);
    //=====PvPoke Print=====//
    let oldName = '';
    for (League in p.pvPoke) {
        p.pvPoke[League].print(p.pvPoke[League].name != oldName);
        if (League != Object.keys(p.pvPoke).slice(-1)) {
            pvPokeDisplay += "<br>";
        }
        oldName = p.pvPoke[League].name;
    }
    if (pvPokeDisplay == "") {
        pvPokeDisplay = "Não se aplica";
    }
    //console.log(pvPokeDisplay);
    setGlobal("%Calcy_PvPoke", pvPokeDisplay);
    //=======Best Print=====//
    setGlobal('%Calcy_bestStr', p.pokeBest.print("Best"));
    //console.log(p.pokeBest.print("Best"))
    //=======Name print=====//
    setGlobal('%Calcy_name', p.name + ((out.length < 12) ? '[' + out.length + ']' : ''));
} catch (e) {
    setGlobal("%Calcy_bestStr", e.toString());
    setClip(tesmath_calcy_data.toString());
}
alertCalcy();

//==========Functions=========//

function pvpIVCalc(rank) {
    return (4096 - rank) / 4095 * 100;
}

function numFormat(num, precision = 0, mode = 'Round', type = "String") {
    let out;
    if (mode == 'Round') {
        out = (Math.round(num * Math.pow(10, precision)) / Math.pow(10, precision));
    } else {
        out = (Math.trunc(num * Math.pow(10, precision)) / Math.pow(10, precision));
    }
    return (type == "String") ? out.toString().replace(/\./, ',') : out;
}


function sanitize(name) {
    if (name.charAt(name.length-1)==' ')
        name=name.slice(0, -1);
    return name.replace(/ Normal| Purificado/, "")
}

function convertToSuperscript(num) {
    let digits = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
    if (num == 100) {
        return '¹⁰⁰';
    } else {
        let dec = (num - num % 10) / 10;
        return ((dec !== 0) ? digits[dec] : '') + digits[num % 10];
    }
}

function alertCalcy() {
    showScene("CalcyAlertCopy", "Overlay", 0, -86);
    setGlobal("%Calcy_alertTimer", 30);
}

function fitName() {
    let fit = 0;
    let sufix = '';
    let out = sanitize(n.name);
    if (out.includes(' ')) {
        let nameArray = out.split(' ');
        out = nameArray[0];
        sufix = nameArray[1].slice(0, 1);
    }
    out = out.slice(0, 12 - n.append.length);
    while (calcSize(n.append + out.slice(0, out.length - fit)) > 24) {
        fit++;
    }
    // console.log('CalcSize=' + calcSize(n.append + out.slice(0, out.length - fit)));
    // console.log('Fit=' + fit);
    // console.log('Len=' + (n.append + out.slice(0, out.length - fit)).length)
    if (fit > 0) {
        out = out.slice(0, -fit);
    }
    if (sufix != '') {
        out = out.slice(0, -1) + sufix;
    }
    return out;
}

function calcSize(str) {
    let limiar = [256, 1024];
    return str.split('').map((x) => {
        return x.charCodeAt(0)
    }).map((x) => {
        return ((x > limiar[0]) ? ((x > limiar[1]) ? 3 : 2) : 1)
    }).reduce((tot, num) => {
        return tot + num
    })
}

// console.log(calcSizeDetailed('˙ⓖAl⓯⓯⑬⁹⁶50'));

// function calcSizeDetailed(str) {
//     let limiar = [256, 1024];
//     console.log(str);
//     x = str.split('').map((x) => {
//         return x.charCodeAt(0)
//     })
//     console.log(x)
//     // console.log(x.map((x) => {
//     //     return x.toString(16)
//     // }))
//     x = x.map((x) => {
//         return (x > limiar[0]) ? ((x > limiar[1]) ? 3 : 2) : 1
//     })
//     console.log(x)
//     return x.reduce((tot, num) => {
//         return tot + num
//     })
// }