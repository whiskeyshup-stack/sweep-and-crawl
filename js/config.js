// --- БАЗОВЫЕ НАСТРОЙКИ ---
const CELL_SIZE = 32;
const TILE_SIZE = 32;

// Базовые (максимальные) размеры карты
const BASE_MAP_W = 140;
const BASE_MAP_H = 140;

// Текущие динамические размеры карты (будут меняться)
let MAP_W = 70; // Изначально в 2 раза меньше (140 / 2 = 70)
let MAP_H = 70;

// Статы игрока и мета-прогресс
let player = {
    maxHp: 100, hp: 100, gold: 0, shards: 0,
    baseAtk: 5, armor: 0, isInvulnerable: false, invulnCharges: 0,
    wins: 0,        // НОВОЕ: Счетчик побед
    raidLevel: 0    // НОВОЕ: Уровень усиления локации
};

// ГЛОБАЛЬНЫЙ ИНВЕНТАРЬ
let items = [];

// Размеры сеток
const GRIDS = {
    'stash': { w: 12, h: 12, el: document.getElementById('stash-grid') },
    'pockets': { w: 6, h: 8, el: document.getElementById('pockets-grid') },
    'equip_sword': { w: 1, h: 3, el: document.getElementById('slot-sword'), restrict: 'weapon' },
    'equip_armor': { w: 2, h: 2, el: document.getElementById('slot-armor'), restrict: 'armor' }
};

// Загрузка графики
const images = {};
function loadImg(name, src) { images[name] = new Image(); images[name].src = src; }
loadImg('orc', 'Orc.png');
loadImg('orc_hurt', 'Orc-Hurt.png');
loadImg('soldier', 'Soldier.png');
loadImg('soldier_hurt', 'Soldier-Hurt.png');
loadImg('tree', 'Oak_Tree_Small.png');
loadImg('bush', 'bushe1.png');
loadImg('vegetation', 'Vegetation_cr.png');
loadImg('rock', 'Rocks_cr.png');
loadImg('grass_tile', 'GrassTile1.png');
loadImg('flowers_ground', 'flowers ground.png');
loadImg('stone_ground', 'stone ground.png');
loadImg('chest_obj', 'Chest.png');
loadImg('swords1', 'swords1.png');
loadImg('swords2', 'swords2.png');
loadImg('swords3', 'swords3.png');
loadImg('chest1', 'Chest1.png');
loadImg('chest2', 'chest2.png');
loadImg('chest3', 'chest3.png');
loadImg('f1', 'f1.png');
loadImg('teleport', 'Teleport.png');
loadImg('heal_small', 'Heal.png');
loadImg('heal_big', 'BigHeal.png');
loadImg('scroll_dmg', 'Damage.png');
loadImg('scroll_invis', 'Invis.png');
loadImg('effect_expo', 'Effect/Expo.png');
loadImg('effect_expo2', 'Effect/Expo2.png');
loadImg('effect_spell', 'Effect/Spell.png');
loadImg('effect_sword', 'Effect/Sword.png');
loadImg('effect_click', 'Effect/click.png');
loadImg('effect_smoke', 'Effect/Smoke.png');
loadImg('effect_smoke2', 'Effect/Smoke2.png');
loadImg('flag', 'flag.png');
loadImg('orc_death', 'Orc-Death.png');
loadImg('soldier_death', 'Soldier-Death_cr.png');
loadImg('afterboom', 'afterboom.png');

// --- ЗВУКОВАЯ СИСТЕМА ---
const sounds = {};
function loadSound(name, src) {
    sounds[name] = new Audio(src);
}

// Загружаем все аудио-файлы
loadSound('boom1', 'sounds/Boom (1).mp3');
loadSound('boom2', 'sounds/Boom (2).mp3');
loadSound('button', 'sounds/Button.mp3');
loadSound('chest1', 'sounds/Chest (1).mp3');
loadSound('chest2', 'sounds/Chest (2).mp3');
loadSound('equip', 'sounds/Equip.mp3');
loadSound('gameover', 'sounds/Game Over.mp3');
loadSound('inventory', 'sounds/Inventory.mp3');
loadSound('music1', 'sounds/Music (1).mp3');
loadSound('music2', 'sounds/Music (2).mp3');
loadSound('raidstart', 'sounds/RaidStart.mp3');
loadSound('shop1', 'sounds/Shop (1).mp3');
loadSound('shop2', 'sounds/Shop (2).mp3');
loadSound('shop3', 'sounds/Shop (3).mp3');
loadSound('sword1', 'sounds/Sword (1).mp3');
loadSound('sword2', 'sounds/Sword (2).mp3');
loadSound('sword3', 'sounds/Sword (3).mp3');
loadSound('sword4', 'sounds/Sword (4).mp3');
loadSound('victory', 'sounds/Victory.mp3');
loadSound('eat', 'sounds/Eat.mp3');
loadSound('holyspell', 'sounds/Holyspell.mp3');
loadSound('damagespell', 'sounds/Damage spell.mp3');
loadSound('ambient', 'sounds/soundreality-nature-forest-sound-537925.mp3');

// Настройка громкости по умолчанию
for (let s in sounds) {
    sounds[s].volume = 0.6;
}

// Настройки аудио системы (поддерживают сохранение)
let audioSettings = {
    masterVol: 100,
    musicVol: 100,
    sfxVol: 100,
    masterMute: false,
    musicMute: false,
    sfxMute: false
};

function applyAudioSettings() {
    const masterSlider = document.getElementById('slider-master');
    const masterMute = document.getElementById('mute-master');
    const musicSlider = document.getElementById('slider-music');
    const musicMute = document.getElementById('mute-music');
    const sfxSlider = document.getElementById('slider-sfx');
    const sfxMute = document.getElementById('mute-sfx');
    
    if (masterSlider) masterSlider.value = audioSettings.masterVol;
    if (masterMute) {
        masterMute.className = 'sound-checkbox ' + (audioSettings.masterMute ? 'unchecked' : 'checked');
    }
    
    if (musicSlider) musicSlider.value = audioSettings.musicVol;
    if (musicMute) {
        musicMute.className = 'sound-checkbox ' + (audioSettings.musicMute ? 'unchecked' : 'checked');
    }
    
    if (sfxSlider) sfxSlider.value = audioSettings.sfxVol;
    if (sfxMute) {
        sfxMute.className = 'sound-checkbox ' + (audioSettings.sfxMute ? 'unchecked' : 'checked');
    }

    let finalMusicVol = 0.25 * (audioSettings.masterVol / 100) * (audioSettings.musicVol / 100);
    if (audioSettings.masterMute || audioSettings.musicMute) {
        finalMusicVol = 0;
    }
    
    if (currentMusic) {
        currentMusic.volume = finalMusicVol;
    }

    if (window.currentAmbient) {
        let finalAmbientVol = 0.15 * (audioSettings.masterVol / 100) * (audioSettings.musicVol / 100);
        if (audioSettings.masterMute || audioSettings.musicMute) {
            finalAmbientVol = 0;
        }
        window.currentAmbient.volume = finalAmbientVol;
    }
}

function changeVolume(type, val) {
    if (type === 'master') audioSettings.masterVol = parseInt(val);
    if (type === 'music') audioSettings.musicVol = parseInt(val);
    if (type === 'sfx') audioSettings.sfxVol = parseInt(val);
    applyAudioSettings();
    if (typeof saveGame === 'function') saveGame();
}

function toggleMute(type) {
    if (type === 'master') audioSettings.masterMute = !audioSettings.masterMute;
    if (type === 'music') audioSettings.musicMute = !audioSettings.musicMute;
    if (type === 'sfx') audioSettings.sfxMute = !audioSettings.sfxMute;
    applyAudioSettings();
    if (typeof saveGame === 'function') saveGame();
}

// Проигрывание эффекта (с клонированием для наложения звуков)
function playSound(name) {
    if (sounds[name]) {
        try {
            let clone = sounds[name].cloneNode(true);
            
            let baseVol = 0.6;
            if (name === 'button' || name.startsWith('boom')) {
                baseVol = 0.3; // В два раза тише
            }
            let finalVol = baseVol * (audioSettings.masterVol / 100) * (audioSettings.sfxVol / 100);
            if (audioSettings.masterMute || audioSettings.sfxMute) {
                finalVol = 0;
            }
            
            clone.volume = finalVol;

            // Случайный питч для сочности звуков (кроме музыки и эмбиента)
            if (name !== 'ambient' && !name.startsWith('music')) {
                clone.playbackRate = 0.85 + Math.random() * 0.3; // от 85% до 115% скорости/тона
            }

            clone.play().catch(err => {
                // Игнорируем автоплей блокировку браузером
            });
        } catch (e) {
            console.error("Ошибка воспроизведения звука:", e);
        }
    }
}

// Эмбиент плеер
window.currentAmbient = null;
function playAmbient() {
    if (sounds['ambient']) {
        if (!window.currentAmbient) {
            window.currentAmbient = sounds['ambient'];
            window.currentAmbient.loop = true;
        }

        let finalAmbientVol = 0.15 * (audioSettings.masterVol / 100) * (audioSettings.musicVol / 100);
        if (audioSettings.masterMute || audioSettings.musicMute) {
            finalAmbientVol = 0;
        }
        window.currentAmbient.volume = finalAmbientVol;
        window.currentAmbient.play().catch(err => {
            // Игнорируем автоплей блокировку браузером
        });
    }
}

function stopAmbient() {
    if (window.currentAmbient) {
        window.currentAmbient.pause();
        window.currentAmbient.currentTime = 0;
    }
}

// Музыкальный плеер (только один экземпляр)
let currentMusic = null;
function playMusic(name) {
    if (sounds[name]) {
        let sameTrack = (currentMusic === sounds[name]);
        if (!sameTrack) {
            if (currentMusic) {
                currentMusic.pause();
                currentMusic.currentTime = 0;
            }
            currentMusic = sounds[name];
        } else {
            // Если тот же трек уже играет и активен, ничего не делаем.
            // Но если он на паузе / закончился, перематываем в начало и запускаем.
            if (!currentMusic.paused && currentMusic.currentTime > 0 && !currentMusic.ended) {
                return;
            }
            currentMusic.currentTime = 0;
        }

        // Если мы в рейде, музыка НЕ зацикливается, чтобы они сменяли друг друга
        currentMusic.loop = (gameState !== 'RAID');
        
        let finalMusicVol = 0.25 * (audioSettings.masterVol / 100) * (audioSettings.musicVol / 100);
        if (audioSettings.masterMute || audioSettings.musicMute) {
            finalMusicVol = 0;
        }
        
        currentMusic.volume = finalMusicVol;
        currentMusic.play().catch(err => {
            // Игнорируем автоплей блокировку браузером
        });
    }
}

// Переключение музыки в рейде по окончании трека (выбираем случайно между music1 и music2)
if (sounds['music1']) {
    sounds['music1'].addEventListener('ended', () => {
        if (gameState === 'RAID') {
            let nextTrack = Math.random() < 0.5 ? 'music1' : 'music2';
            playMusic(nextTrack);
        }
    });
}
if (sounds['music2']) {
    sounds['music2'].addEventListener('ended', () => {
        if (gameState === 'RAID') {
            let nextTrack = Math.random() < 0.5 ? 'music1' : 'music2';
            playMusic(nextTrack);
        }
    });
}

function stopMusic() {
    if (currentMusic) {
        currentMusic.pause();
        currentMusic.currentTime = 0;
        currentMusic = null;
    }
    stopAmbient();
}

// Кастомная система модальных окон
function showCustomModal(message, title = null, showCancel = false) {
    return new Promise((resolve) => {
        const overlay = document.getElementById('custom-modal-overlay');
        const titleEl = document.getElementById('custom-modal-title');
        const msgEl = document.getElementById('custom-modal-message');
        const okBtn = document.getElementById('custom-modal-ok');
        const cancelBtn = document.getElementById('custom-modal-cancel');
        
        let finalTitle = title || t('modal_title_attention');
        titleEl.innerHTML = finalTitle;
        msgEl.innerHTML = message.replace(/\n/g, '<br>');
        
        // Локализация кнопок
        okBtn.textContent = t('modal_ok');
        cancelBtn.textContent = t('modal_cancel');
        
        if (showCancel) {
            cancelBtn.classList.remove('hidden');
        } else {
            cancelBtn.classList.add('hidden');
        }
        
        overlay.classList.remove('hidden');
        
        const cleanup = () => {
            overlay.classList.add('hidden');
            okBtn.removeEventListener('click', onOk);
            cancelBtn.removeEventListener('click', onCancel);
        };
        
        const onOk = () => {
            playSound('button');
            cleanup();
            resolve(true);
        };
        
        const onCancel = () => {
            playSound('button');
            cleanup();
            resolve(false);
        };
        
        okBtn.addEventListener('click', onOk);
        cancelBtn.addEventListener('click', onCancel);
    });
}

function getRaidStatsSummary() {
    if (!window.raidStats || !window.raidStats.startTime) return "";
    
    let clearancePct = 0;
    if (window.totalSafeCells > 0) {
        clearancePct = Math.round((window.revealedSafeCells / window.totalSafeCells) * 100);
    }
    
    let elapsed = Math.floor((Date.now() - window.raidStats.startTime) / 1000);
    let min = Math.floor(elapsed / 60);
    let sec = elapsed % 60;
    let timeStr = `${min}:${sec < 10 ? '0' : ''}${sec}`;
    
    return `\n\n${t('stats_header')}\n` +
           `${t('stats_clearance')} ${clearancePct}%\n` +
           `${t('stats_time')} ${timeStr}\n` +
           `${t('stats_killed')} ${window.raidStats.enemiesKilled}\n` +
           `${t('stats_chests')} ${window.raidStats.chestsOpened}\n` +
           `${t('stats_mines')} ${window.raidStats.minesTriggered}\n` +
           `${t('stats_gold')} ${window.raidStats.goldLooted}<img src="Ui/Coin.png" class="ui-icon">\n` +
           `${t('stats_shards')} ${window.raidStats.shardsLooted}<img src="Ui/SoulShard.png" class="ui-icon">`;
}

let grid = [];
let firstClick = true;
let gameState = 'HUB';