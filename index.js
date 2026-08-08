const notes = ['V', 'B', 'N', 'M', 'Q', 'W', 'E', 'A', 'S', 'D', 'X', 'Z', 'C', 'I', 'O', 'P'];

const tiles = document.querySelectorAll('kbd');

function playNote(index) {
    const sound = new Audio('snd3/' + notes[index] + '.mp3');
    sound.play();
}

function pressTile(index) {
    tiles[index].classList.add('pressed');
}

function releaseTile(index) {
    tiles[index].classList.remove('pressed');
}

document.addEventListener('keydown', function (event) {
    if (event.repeat) {
        return;
    }
    notes.forEach(function (item, index) {
        if (event.code === 'Key' + item) {
            playNote(index);
            pressTile(index);
        }
    });
});

document.addEventListener('keyup', function (event) {
    notes.forEach(function (item, index) {
        if (event.code === 'Key' + item) {
            releaseTile(index);
        }
    });
});

tiles.forEach(function (tile, index) {
    tile.addEventListener('mousedown', function () {
        playNote(index);
        pressTile(index);
    });
    tile.addEventListener('mouseup', function () {
        releaseTile(index);
    });
    tile.addEventListener('mouseleave', function () {
        releaseTile(index);
    });
});
