const SAMPLES = 'snd3/';

const tiles = new Map();
document.querySelectorAll('.bell[data-note]').forEach(function (el) {
    tiles.set(el.dataset.note, el);
    // Колокол работает как кнопка: доступен с клавиатуры и для скринридеров.
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
});

/* --- Звук ---
   Основной путь — Web Audio: сэмплы декодируются один раз, удары не имеют
   задержки и звучат полифонично (колокол продолжает гудеть, пока по нему
   бьют снова). Если Web Audio недоступен или страница открыта как файл
   (fetch запрещён), используется запасной путь на <audio>. */
const buffers = new Map();
const audioTags = new Map();
const ringing = new Set();
let audioCtx = null;

// Запасной <audio> создаётся только когда он действительно нужен, чтобы не
// качать все сэмплы дважды в основном (Web Audio) режиме.
function audioTag(note) {
    if (!audioTags.has(note)) {
        const tag = new Audio(SAMPLES + note + '.mp3');
        tag.preload = 'auto';
        audioTags.set(note, tag);
    }
    return audioTags.get(note);
}

function decodeAll() {
    return Promise.all([...tiles.keys()].map(function (note) {
        return fetch(SAMPLES + note + '.mp3')
            .then(function (res) { return res.arrayBuffer(); })
            .then(function (data) { return audioCtx.decodeAudioData(data); })
            .then(function (buffer) { buffers.set(note, buffer); })
            .catch(function () { /* для этого колокола останется <audio> */ });
    }));
}

// Браузер разрешает звук только после действия пользователя, поэтому
// контекст создаётся и возобновляется при первом ударе.
function wakeAudio() {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (!Ctx) {
        return;
    }
    if (!audioCtx) {
        audioCtx = new Ctx();
        decodeAll();
    }
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

function strike(note) {
    const buffer = buffers.get(note);
    if (audioCtx && buffer) {
        const source = audioCtx.createBufferSource();
        source.buffer = buffer;
        source.connect(audioCtx.destination);
        source.start();
        return;
    }
    const tag = audioTag(note);
    // Свободный <audio> переиспользуется, копия нужна только чтобы удары
    // накладывались друг на друга. Ссылка на голос удерживается до конца
    // звучания, иначе браузер вправе оборвать его загрузку.
    const voice = (tag.paused || tag.ended) ? tag : tag.cloneNode();
    ringing.add(voice);
    voice.addEventListener('ended', function () { ringing.delete(voice); }, { once: true });
    voice.addEventListener('error', function () { ringing.delete(voice); }, { once: true });
    try {
        voice.currentTime = 0;
    } catch (e) {
        // сэмпл ещё не загружен — играем с начала, это и так начало
    }
    const playing = voice.play();
    if (playing) {
        playing.catch(function () { ringing.delete(voice); });
    }
}

function press(note) {
    const el = tiles.get(note);
    if (el) {
        el.classList.add('pressed');
    }
}

function release(note) {
    const el = tiles.get(note);
    if (el) {
        el.classList.remove('pressed');
    }
}

function releaseAll() {
    tiles.forEach(function (el) {
        el.classList.remove('pressed');
    });
}

// Подсветка ставится до звука: если со звуком что-то пойдёт не так, колокол
// всё равно отзовётся на нажатие, а не будет выглядеть неработающим.
function hit(note) {
    press(note);
    try {
        wakeAudio();
        strike(note);
    } catch (e) {
        // звук недоступен — само нажатие при этом продолжает работать
    }
}

/* --- Клавиатура ---
   event.code не зависит от раскладки, поэтому колокола отзываются
   и при русской раскладке. */
document.addEventListener('keydown', function (event) {
    if (event.repeat || event.ctrlKey || event.metaKey || event.altKey) {
        return;
    }
    const match = /^Key([A-Z])$/.exec(event.code);
    if (!match || !tiles.has(match[1])) {
        return;
    }
    event.preventDefault();
    hit(match[1]);
});

document.addEventListener('keyup', function (event) {
    const match = /^Key([A-Z])$/.exec(event.code);
    if (match) {
        release(match[1]);
    }
});

// Если окно теряет фокус во время нажатия, колокол не должен «залипать».
window.addEventListener('blur', releaseAll);

/* --- Мышь, касание, перо --- */
tiles.forEach(function (el, note) {
    el.addEventListener('pointerdown', function (event) {
        event.preventDefault();
        hit(note);
    });

    // Пробел и Enter — для тех, кто управляет страницей только клавишей Tab.
    el.addEventListener('keydown', function (event) {
        if ((event.key === 'Enter' || event.key === ' ') && !event.repeat) {
            event.preventDefault();
            hit(note);
        }
    });

    el.addEventListener('keyup', function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
            release(note);
        }
    });
});

document.addEventListener('pointerup', releaseAll);
document.addEventListener('pointercancel', releaseAll);
