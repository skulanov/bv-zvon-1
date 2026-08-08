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

// Колокол "N" должен всегда быть выровнен по правому краю с колоколом "P",
// как на реальной звоннице. Пересчитывается при загрузке и изменении
// размера окна, т.к. размеры колоколов адаптивные (vw/clamp).
function alignWestBell() {
    const container = document.querySelector('.blago-container-w');
    const westBell = document.querySelector('.blago-bell-west');
    const zazvBells = document.querySelectorAll('.zazv-bells');
    if (!container || !westBell || zazvBells.length === 0) {
        return;
    }
    const lastZazvBell = zazvBells[zazvBells.length - 1];

    container.style.setProperty('--align-x', '0px');
    const westRect = westBell.getBoundingClientRect();
    const targetRect = lastZazvBell.getBoundingClientRect();
    const diff = targetRect.right - westRect.right;
    container.style.setProperty('--align-x', diff + 'px');
}

window.addEventListener('load', alignWestBell);
window.addEventListener('resize', alignWestBell);
if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(alignWestBell);
}
