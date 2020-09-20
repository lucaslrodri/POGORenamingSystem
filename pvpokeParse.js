var fs = require('fs');

function extractDB(archive) {
    let data = fs.readFileSync(archive, 'utf8');
    let out = {
        name: data.match(/name">[^<]*/g),
        score: data.match(/rating">[^<]*/g)
    }

    for (i = 0; i < out.name.length; i++) {
        out.name[i] = out.name[i].slice(6);
        out.score[i] = parseFloat(out.score[i].slice(8));
    }
    return out;
}

var pvPoke = {
    "Great": extractDB('pvpoke_great.htm'),
    "Ultra": extractDB('pvpoke_ultra.htm'),
    "Master": extractDB('pvpoke_master.htm'),
    "Premier": extractDB('pvpoke_premier.htm')
}

//Here you should translate some pokemons name
jsonStr = JSON.stringify(pvPoke).replace(/[(-)]/g, '').replace(/Shadow/g, 'Sombra').replace(/Alolan/g, 'Alola').replace(/Galarian/g, 'Galar');
jsonStr = jsonStr.replace(/Mewtwo Armored/, 'Mewtwo Armadura');
jsonStr = jsonStr.replace(/Castform Rainy/, 'Castform Chuvoso').replace(/Castform Snowy/, 'Castform Neve').replace(/Castform Sunny/, 'Castform Ensolarado');
jsonStr = jsonStr.replace(/Castform Rainy/, 'Castform Chuvoso').replace(/Castform Snowy/, 'Castform Neve').replace(/Castform Sunny/, 'Castform Ensolarado');
jsonStr = jsonStr.replace(/Cherrim Sunny/, 'Cherrim Sunshine');
jsonStr = jsonStr.replace(/Gastrodon East/g, 'Gastrodon East Sea').replace(/Gastrodon West/g, 'Gastrodon West Sea');

fs.writeFile('pvPokeDB.json', jsonStr, 'utf8', function (err) {
    if (err) {
        console.log("Um erro ocorreu enquanto criava o banco de dados para o PvP.");
        return console.log(err);
    }

    console.log("Banco de dados criado.");
});
