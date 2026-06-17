// --- ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ ---
function logEvent(msg, styleClass = '') {
    const logEl = document.getElementById('event-log');
    if (!logEl) return;
    const div = document.createElement('div');
    if (styleClass) {
        div.className = styleClass;
    }
    div.innerText = msg;
    logEl.appendChild(div);
    logEl.scrollTop = logEl.scrollHeight;
}

// --- STATE MACHINE (ХАБ / РЕЙД) ---
function showHub() {
    gameState = 'HUB';
    stopMusic();
    applyAudioSettings();
    applyLanguage();
    const welcomeEl = document.getElementById('welcome-screen');
    if (welcomeEl) welcomeEl.style.display = 'none';
    document.getElementById('hub-screen').style.display = 'flex';
    document.getElementById('raid-screen').style.display = 'none';

    const eqPanel = document.getElementById('equipment-panel');
    if (eqPanel) {
        document.getElementById('equipment-parent-hub').appendChild(eqPanel);
    }

    player.hp = player.maxHp;
    player.isInvulnerable = false;
    player.invulnCharges = 0;

    document.getElementById('hub-gold').innerText = player.gold;
    document.getElementById('hub-shards').innerText = player.shards;
    document.getElementById('hub-wins').innerText = player.wins || 0;
    // Заменить: document.getElementById('hub-raid-lvl').innerText = player.raidLevel || 0;
    if (player.selectedRaidLevel === undefined) player.selectedRaidLevel = player.raidLevel || 0;
    document.getElementById('hub-raid-lvl').innerText = player.selectedRaidLevel;

    document.getElementById('hub-atk').innerText = player.baseAtk;
    document.getElementById('hub-hp').innerText = player.maxHp;
    document.getElementById('hub-arm').innerText = player.armor;

    let atkCost = 10 + (player.baseAtk - 5) * 5;
    let hpCost = 15 + Math.floor((player.maxHp - 100) / 10) * 5;
    let armCost = 20 + player.armor * 10;

    document.getElementById('up-atk-btn').disabled = player.shards < atkCost;
    document.getElementById('up-hp-btn').disabled = player.shards < hpCost;
    document.getElementById('up-arm-btn').disabled = player.shards < armCost;

    const buyBtn = document.getElementById('buy-shards-btn');
    if (buyBtn) buyBtn.disabled = player.gold < 100;

    renderInventory();
    saveGame();
}
function changeRaidLevel(delta) {
    playSound('button');
    let maxLevel = player.raidLevel || 0;

    // Если переменной еще нет, инициализируем её
    if (player.selectedRaidLevel === undefined) {
        player.selectedRaidLevel = maxLevel;
    }

    player.selectedRaidLevel += delta;

    // Ограничиваем выбор от 0 до максимально открытого уровня
    if (player.selectedRaidLevel < 0) player.selectedRaidLevel = 0;
    if (player.selectedRaidLevel > maxLevel) player.selectedRaidLevel = maxLevel;

    showHub();
}
function upgradeStat(stat) {
    let success = false;
    if (stat === 'atk') {
        let cost = 10 + (player.baseAtk - 5) * 5;
        if (player.shards >= cost) {
            player.shards -= cost;
            player.baseAtk += 1;
            logEvent(t('msg_stat_upgraded'), "log-sys");
            success = true;
        }
    } else if (stat === 'hp') {
        let cost = 15 + Math.floor((player.maxHp - 100) / 10) * 5;
        if (player.shards >= cost) {
            player.shards -= cost;
            player.maxHp += 10;
            player.hp = player.maxHp;
            logEvent(t('msg_stat_upgraded'), "log-sys");
            success = true;
        }
    } else if (stat === 'arm') {
        let cost = 20 + player.armor * 10;
        if (player.shards >= cost) {
            player.shards -= cost;
            player.armor += 1;
            logEvent(t('msg_stat_upgraded'), "log-sys");
            success = true;
        }
    }
    if (success) {
        playSound('shop' + (Math.floor(Math.random() * 3) + 1));
    } else {
        playSound('button');
    }
    showHub();
}

function buyShards() {
    if (player.gold >= 100) {
        player.gold -= 100;
        player.shards += 5;
        logEvent(t('msg_gold_purchased'), "log-sys");
        playSound('shop' + (Math.floor(Math.random() * 3) + 1));
        showHub();
    } else {
        playSound('button');
        logEvent(t('msg_not_enough_gold'), "log-error");
    }
}

function startRaid() {
    gameState = 'RAID';
    playSound('raidstart');
    playMusic(Math.random() < 0.5 ? 'music1' : 'music2');
    player.isInvulnerable = false;
    player.invulnCharges = 0;

    window.raidStats = {
        enemiesKilled: 0,
        chestsOpened: 0,
        minesTriggered: 0,
        goldLooted: 0,
        shardsLooted: 0,
        startTime: Date.now()
    };

    document.getElementById('hub-screen').style.display = 'none';
    document.getElementById('raid-screen').style.display = 'flex';

    const eqPanel = document.getElementById('equipment-panel');
    if (eqPanel) {
        document.getElementById('equipment-parent-raid').appendChild(eqPanel);
    }
    let activeLevel = Math.min(3, player.selectedRaidLevel !== undefined ? player.selectedRaidLevel : (player.raidLevel || 0));

    let sizeMultiplier = 30 / BASE_MAP_W; // 0 уровень равен ровно 30x30
    if (activeLevel === 1) sizeMultiplier = 0.56;
    else if (activeLevel === 2) sizeMultiplier = 0.78;
    else if (activeLevel >= 3) sizeMultiplier = 1.0;

    MAP_W = Math.floor(BASE_MAP_W * sizeMultiplier);
    MAP_H = Math.floor(BASE_MAP_H * sizeMultiplier);
    // ...
    initGrid();

    let sX = Math.floor(MAP_W / 2);
    let sY = Math.floor(MAP_H / 2);

    generateLevel(sX, sY);

    for (let dx = -2; dx <= 2; dx++) {
        for (let dy = -2; dy <= 2; dy++) {
            let tx = sX + dx;
            let ty = sY + dy;
            if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
                grid[tx][ty].isRevealed = true;
            }
        }
    }

    cameraX = sX * CELL_SIZE - Math.floor(VIEWPORT_W / 2 / CELL_SIZE) * CELL_SIZE;
    cameraY = sY * CELL_SIZE - Math.floor(VIEWPORT_H / 2 / CELL_SIZE) * CELL_SIZE;
    clampCamera();

    firstClick = false;
    logEvent(t('msg_raid_start_log', { lvl: activeLevel }), "log-sys");
    updateUi();

    // Инициализация системы облаков для нового рейда
    window.lastCloudUpdate = Date.now();
    if (typeof initClouds === 'function') {
        initClouds();
    }

    // Запуск оптимизированного анимационного цикла отрисовки
    if (typeof startGameLoop === 'function') {
        startGameLoop();
    } else {
        drawBoard();
    }
}

function updateUi() {
    if (gameState !== 'RAID') return;

    if (window.isGodModeActive) {
        player.hp = player.maxHp;
    }

    let displayHp = Math.floor(player.hp);
    document.getElementById('hp-txt-val').innerText = `${displayHp}/${player.maxHp}`;
    document.getElementById('hp-text').innerText = `${displayHp} / ${player.maxHp}`;
    document.getElementById('hp-bar').style.width = `${Math.max(0, (player.hp / player.maxHp) * 100)}%`;

    document.getElementById('atk-val').innerText = player.baseAtk + getEquipStat('weapon');
    document.getElementById('arm-val').innerText = player.armor + getEquipStat('armor');
}

function die() {
    logEvent(t('msg_died_log'), "log-error");
    stopMusic();
    playSound('gameover');
    items = items.filter(it => it.container !== 'pockets');
    showHub();
    showCustomModal(t('msg_defeat_text') + getRaidStatsSummary(), t('modal_title_defeat'));
}

// --- ЛОКАЛЬНОЕ СОХРАНЕНИЕ ---

function saveGame() {
    try {
        const saveData = {
            player: player,
            items: items,
            audioSettings: audioSettings,
            lang: window.currentLanguage
        };
        localStorage.setItem('sweep_crawl_save', JSON.stringify(saveData));
    } catch (e) {
        console.error("Не удалось сохранить прогресс:", e);
    }
}

function loadGame() {
    try {
        const saved = localStorage.getItem('sweep_crawl_save');
        if (saved) {
            const data = JSON.parse(saved);
            player = Object.assign(player, data.player);
            items = data.items || [];

            if (data.audioSettings) {
                audioSettings = Object.assign(audioSettings, data.audioSettings);
            }

            if (data.lang) {
                window.currentLanguage = data.lang;
            } else {
                window.currentLanguage = 'ru';
            }
            applyLanguage();

            items.forEach(it => {
                if (it.container === 'pockets') it.container = 'stash';
            });

            console.log("Прогресс успешно загружен!");
        } else {
            applyLanguage();
        }
    } catch (e) {
        console.error("Ошибка при загрузке сохранения:", e);
        applyLanguage();
    }
}

async function resetGame() {
    let firstConfirm = await showCustomModal(t('msg_reset_confirm_1'), t('modal_title_attention'), true);
    if (firstConfirm) {
        let secondConfirm = await showCustomModal(t('msg_reset_confirm_2'), t('modal_title_attention'), true);
        if (secondConfirm) {
            localStorage.removeItem('sweep_crawl_save');
            await showCustomModal(t('msg_reset_done'));
            window.location.reload();
        }
    }
}

window.isGodModeActive = false;

function toggleDebugGodmode() {
    window.isGodModeActive = !window.isGodModeActive;
    const btn = document.getElementById('debug-godmode-btn');

    if (window.isGodModeActive) {
        btn.style.background = "#2e7d32";
        btn.style.borderColor = "#4caf50";
        btn.style.color = "#fff";
        btn.innerText = "DEBUG: 🛡️ GODMODE [ON]";
        logEvent(t('debug_godmode_on'), "log-loot");
    } else {
        btn.style.background = "#444";
        btn.style.borderColor = "#555";
        btn.style.color = "#ff5555";
        btn.innerText = "DEBUG: 🛡️ GODMODE [OFF]";
        logEvent(t('debug_godmode_off'), "log-sys");
    }
    updateUi();
}

// --- УПРАВЛЕНИЕ КАМЕРОЙ С КЛАВИАТУРЫ ---
// --- УПРАВЛЕНИЕ КАМЕРОЙ С КЛАВИАТУРЫ ---
window.addEventListener('keydown', (e) => {
    if (gameState !== 'RAID') return;

    const speed = CELL_SIZE;
    let moved = false;

    switch (e.key.toLowerCase()) {
        case 'w':
        case 'arrowup':
            cameraY -= speed;
            moved = true;
            break;
        case 's':
        case 'arrowdown':
            cameraY += speed;
            moved = true;
            break;
        case 'a':
        case 'arrowleft':
            cameraX -= speed;
            moved = true;
            break;
        case 'd':
        case 'arrowright':
            cameraX += speed;
            moved = true;
            break;
    }

    if (moved) {
        e.preventDefault();
        clampCamera();
        drawBoard();
    }
});

function showWelcome() {
    gameState = 'WELCOME';
    playMusic('music1');
    applyAudioSettings();
    applyLanguage();
    document.getElementById('welcome-screen').style.display = 'flex';
    document.getElementById('hub-screen').style.display = 'none';
    document.getElementById('raid-screen').style.display = 'none';
    const logEl = document.getElementById('event-log');
    if (logEl) logEl.style.display = 'none';
}

function startGame() {
    playSound('button');
    document.getElementById('welcome-screen').style.display = 'none';
    const logEl = document.getElementById('event-log');
    if (logEl) logEl.style.display = 'block';
    showHub();
}

// --- ЗАПУСК ИГРЫ И АНИМАЦИОННЫЙ ТАЙМЕР ---
loadGame(); // Сначала загружаем данные игрока
showWelcome();  // Затем инициализируем и показываем приветственный экран

// --- ИГРОВОЙ АНИМАЦИОННЫЙ ЦИКЛ (ОПТИМИЗАЦИЯ requestAnimationFrame с лимитом 30 FPS) ---
let animationFrameId = null;
let lastRenderTime = 0;
const FPS_LIMIT = 30;
const FRAME_DURATION = 1000 / FPS_LIMIT; // ~33.3ms

function gameLoop(currentTime) {
    if (gameState === 'RAID') {
        if (!currentTime) currentTime = performance.now();
        let elapsed = currentTime - lastRenderTime;

        if (elapsed >= FRAME_DURATION) {
            lastRenderTime = currentTime - (elapsed % FRAME_DURATION);
            if (typeof drawBoard === 'function') {
                drawBoard();
            }
        }
        animationFrameId = requestAnimationFrame(gameLoop);
    } else {
        animationFrameId = null;
    }
}

function startGameLoop() {
    if (!animationFrameId) {
        window.lastCloudUpdate = Date.now();
        lastRenderTime = performance.now();
        animationFrameId = requestAnimationFrame(gameLoop);
    }
}