// --- ЛОГИКА САПЕРА ---

// Координаты клетки, на которую сейчас наведен курсор (для прозрачности деревьев)
window.hoveredCellX = -1;
window.hoveredCellY = -1;

// Вспомогательные функции для броска кубиков
function rollDice(count, sides) {
    let sum = 0;
    let rolls = [];
    for (let i = 0; i < count; i++) {
        let r = Math.floor(Math.random() * sides) + 1;
        rolls.push(r);
        sum += r;
    }
    return { sum, rolls };
}

function rollPlayerDamage() {
    let weapon = items.find(it => it.container === 'equip_sword');
    let baseAtk = player.baseAtk;
    if (!weapon) {
        let roll = rollDice(1, 4);
        return {
            dmg: roll.sum + baseAtk,
            notation: `1d4`,
            rolls: roll.rolls,
            mod: baseAtk
        };
    }

    let diceSides = 4;
    let qualityVal = weapon.qualityVal;
    if (qualityVal === undefined) {
        if (weapon.rarity === 'red') qualityVal = 8;
        else if (weapon.rarity === 'green') qualityVal = 5;
        else qualityVal = 2;
    }

    if (qualityVal <= 2) diceSides = 4;
    else if (qualityVal <= 4) diceSides = 6;
    else if (qualityVal <= 6) diceSides = 8;
    else if (qualityVal <= 8) diceSides = 10;
    else diceSides = 12;

    let count = weapon.lvl || 1;
    let roll = rollDice(count, diceSides);
    return {
        dmg: roll.sum + baseAtk,
        notation: `${count}d${diceSides}`,
        rolls: roll.rolls,
        mod: baseAtk
    };
}


function initGrid() {
    grid = [];
    for (let x = 0; x < MAP_W; x++) {
        grid[x] = [];
        for (let y = 0; y < MAP_H; y++) {
            grid[x][y] = {
                isRevealed: false, isFlagged: false,
                isMine: false,
                isEnemy: false,
                enemyType: null, enemyHp: 0, lvl: 1,
                corpseType: null,
                afterboomIndex: null,
                isChest: false,
                chestLvl: 1,
                isTree: false,
                isBush: false,
                isVegetation: false,
                isRock: false,
                decorFrame: 0,
                treeFrame: 0,
                isHurt: false,
                threatCount: 0,
                tileX: 0,
                tileY: 0,
                tileType: 'grass'
            };
        }
    }

    // Генерируем органические пятна (поляны) цветов и вариаций травы
    let patchCount = Math.floor((MAP_W * MAP_H) / 60);
    for (let i = 0; i < patchCount; i++) {
        let cx = Math.floor(Math.random() * MAP_W);
        let cy = Math.floor(Math.random() * MAP_H);
        let radius = 2 + Math.floor(Math.random() * 5); // радиус от 2 до 6 клеток
        
        let isFlowerPatch = Math.random() < 0.35; // 35% шанс поляны цветов, 65% - густой травы
        
        // Выбираем конкретную вариацию текстуры для этого пятна
        let patchTileX = Math.floor(Math.random() * 4);
        let patchTileY = Math.floor(Math.random() * 4);

        for (let dx = -radius; dx <= radius; dx++) {
            for (let dy = -radius; dy <= radius; dy++) {
                let tx = cx + dx;
                let ty = cy + dy;
                if (tx >= 0 && tx < MAP_W && ty >= 0 && ty < MAP_H) {
                    let dist = Math.sqrt(dx*dx + dy*dy);
                    let spawnChance = 1 - (dist / radius);
                    if (Math.random() < spawnChance) {
                        if (isFlowerPatch) {
                            grid[tx][ty].tileType = 'flower';
                            grid[tx][ty].tileX = patchTileX;
                            grid[tx][ty].tileY = patchTileY;
                        } else {
                            grid[tx][ty].tileType = 'grass';
                            grid[tx][ty].tileX = patchTileX;
                            grid[tx][ty].tileY = patchTileY;
                        }
                    }
                }
            }
        }
    }
}

// --- ПРЕДПОДГОТОВКА СТАТИЧЕСКОГО ФОНА (ОПТИМИЗАЦИЯ) ---
window.bgCanvas = null;
window.bgCtx = null;

function prerenderBackground() {
    if (!window.bgCanvas) {
        window.bgCanvas = document.createElement('canvas');
    }
    window.bgCanvas.width = MAP_W * CELL_SIZE;
    window.bgCanvas.height = MAP_H * CELL_SIZE;
    window.bgCtx = window.bgCanvas.getContext('2d');
    window.bgCtx.imageSmoothingEnabled = false;

    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let cell = grid[x][y];
            let px = x * CELL_SIZE;
            let py = y * CELL_SIZE;

            let groundImg = images.grass_tile;
            if (cell.tileType === 'flower' && images.flowers_ground.complete) {
                groundImg = images.flowers_ground;
            } else if (cell.tileType === 'stone' && images.stone_ground.complete) {
                groundImg = images.stone_ground;
            }

            if (groundImg && groundImg.complete) {
                window.bgCtx.drawImage(groundImg, cell.tileX * 32, cell.tileY * 32, 32, 32, px, py, CELL_SIZE, CELL_SIZE);
            } else {
                window.bgCtx.fillStyle = cell.tileType === 'stone' ? '#78909c' : '#2e7d32';
                window.bgCtx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
            }
        }
    }
}

function generateLevel(sX, sY) {
    let activeLevel = Math.min(3, player.selectedRaidLevel !== undefined ? player.selectedRaidLevel : (player.raidLevel || 0));

    const maxDist = Math.sqrt(MAP_W * MAP_W + MAP_H * MAP_H) / 2;
    const SAFE_RADIUS = 5;

    // 1. Спавн деревьев
    let forestCenters = [];
    let forestCount = Math.floor((MAP_W * MAP_H) / 100) + Math.floor(Math.random() * 8);
    for (let i = 0; i < forestCount; i++) {
        let rx = Math.floor(Math.random() * MAP_W);
        let ry = Math.floor(Math.random() * MAP_H);
        if (Math.abs(rx - sX) <= SAFE_RADIUS && Math.abs(ry - sY) <= SAFE_RADIUS) continue;
        forestCenters.push({ x: rx, y: ry });
        grid[rx][ry].isTree = true;
        grid[rx][ry].treeFrame = Math.floor(Math.random() * 3);
    }
    forestCenters.forEach(center => {
        for (let dx = -4; dx <= 4; dx++) {
            for (let dy = -4; dy <= 4; dy++) {
                let tx = center.x + dx;
                let ty = center.y + dy;
                if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) continue;
                if (Math.abs(tx - sX) <= SAFE_RADIUS && Math.abs(ty - sY) <= SAFE_RADIUS) continue;
                let d = Math.abs(dx) + Math.abs(dy);
                let chance = d === 1 ? 0.8 : d === 2 ? 0.5 : d <= 4 ? 0.2 : 0;
                if (Math.random() < chance && !grid[tx][ty].isTree && !grid[tx][ty].isBush && !grid[tx][ty].isVegetation && !grid[tx][ty].isRock) {
                    if (Math.random() < 0.25) {
                        grid[tx][ty].isBush = true;
                    } else {
                        grid[tx][ty].isTree = true;
                        grid[tx][ty].treeFrame = Math.floor(Math.random() * 3);
                    }
                }
            }
        }
    });

    // 1.5. Спавн вегетации и камней (полянами)
    let vegCenters = [];
    let vegCount = Math.floor((MAP_W * MAP_H) / 40) + Math.floor(Math.random() * 40);
    for (let i = 0; i < vegCount; i++) {
        let rx = Math.floor(Math.random() * MAP_W);
        let ry = Math.floor(Math.random() * MAP_H);
        if (Math.abs(rx - sX) <= SAFE_RADIUS && Math.abs(ry - sY) <= SAFE_RADIUS) continue;
        if (!grid[rx][ry].isTree && !grid[rx][ry].isBush && !grid[rx][ry].isRock && !grid[rx][ry].isVegetation) {
            vegCenters.push({ x: rx, y: ry });
            grid[rx][ry].isVegetation = true;
            grid[rx][ry].decorFrame = Math.floor(Math.random() * 4);
        }
    }
    vegCenters.forEach(center => {
        for (let dx = -3; dx <= 3; dx++) {
            for (let dy = -3; dy <= 3; dy++) {
                let tx = center.x + dx;
                let ty = center.y + dy;
                if (tx < 0 || tx >= MAP_W || ty < 0 || ty >= MAP_H) continue;
                if (Math.abs(tx - sX) <= SAFE_RADIUS && Math.abs(ty - sY) <= SAFE_RADIUS) continue;
                if (grid[tx][ty].isTree || grid[tx][ty].isBush || grid[tx][ty].isVegetation || grid[tx][ty].isRock) continue;
                
                let d = Math.abs(dx) + Math.abs(dy);
                let chance = d === 1 ? 0.9 : d === 2 ? 0.45 : d <= 3 ? 0.15 : 0;
                
                if (Math.random() < chance) {
                    if (Math.random() < 0.25) {
                        grid[tx][ty].isRock = true;
                        grid[tx][ty].decorFrame = Math.floor(Math.random() * 4);
                    } else {
                        grid[tx][ty].isVegetation = true;
                        grid[tx][ty].decorFrame = Math.floor(Math.random() * 4);
                    }
                }
            }
        }
    });

    // 1.6 Дополнительный глобальный спавн одиночной вегетации и камней
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            if (Math.abs(x - sX) <= SAFE_RADIUS && Math.abs(y - sY) <= SAFE_RADIUS) continue;
            if (grid[x][y].isTree || grid[x][y].isBush || grid[x][y].isVegetation || grid[x][y].isRock) continue;
            if (Math.random() < 0.15) {
                if (Math.random() < 0.15) {
                    grid[x][y].isRock = true;
                    grid[x][y].decorFrame = Math.floor(Math.random() * 4);
                } else {
                    grid[x][y].isVegetation = true;
                    grid[x][y].decorFrame = Math.floor(Math.random() * 4);
                }
            }
        }
    }

    // 1.7 Дополнительный густой спавн травы под всеми деревьями и кустами (для лесов)
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let cell = grid[x][y];
            if (cell.isTree || cell.isBush) {
                if (Math.random() < 0.85) {
                    cell.isVegetation = true;
                    cell.decorFrame = Math.floor(Math.random() * 4);
                }
            }
        }
    }

    // 2. Спавн мин (количество увеличивается на 10% за каждый уровень рейда)
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let dist = Math.sqrt((x - sX) ** 2 + (y - sY) ** 2);
            if (dist <= SAFE_RADIUS) continue;
            if (grid[x][y].isTree || grid[x][y].isBush || grid[x][y].isVegetation || grid[x][y].isRock || grid[x][y].isEnemy) continue;

            let t = (dist - SAFE_RADIUS) / (maxDist - SAFE_RADIUS);
            let mineChance = 0.25 + t * 0.40;

            // Модификатор усложнения количества мин (+10% за уровень)
            mineChance = mineChance * (1 + activeLevel * 0.10);

            if (Math.random() < mineChance) {
                grid[x][y].isMine = true;
            }
        }
    }

    // 3. Спавн врагов (+1 базовый уровень за каждый уровень рейда)
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let dist = Math.sqrt((x - sX) ** 2 + (y - sY) ** 2);
            if (dist <= SAFE_RADIUS) continue;
            if (grid[x][y].isMine || grid[x][y].isTree || grid[x][y].isBush || grid[x][y].isVegetation || grid[x][y].isRock) continue;
            let t = (dist - SAFE_RADIUS) / (maxDist - SAFE_RADIUS);

            let enemyChance = 0.05 + t * 0.10;
            if (Math.random() < enemyChance) {
                grid[x][y].isEnemy = true;

                // Уровень врага увеличивается под воздействием уровня рейда (+1 за уровень)
                let lvl = Math.max(1, Math.floor(dist / 4)) + activeLevel;
                grid[x][y].lvl = lvl;

                grid[x][y].enemyType = (t > 0.4 && Math.random() < 0.6) ? 'orc' : 'soldier';
                let hpBase = grid[x][y].enemyType === 'orc' ? 20 : 10;
                grid[x][y].enemyHp = lvl * hpBase;
            }
        }
    }

    // 4. Спавн сундуков (Шанс снижен до 1%)
    let destinations = [];
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let dist = Math.sqrt((x - sX) ** 2 + (y - sY) ** 2);
            if (dist <= SAFE_RADIUS) continue;
            if (!grid[x][y].isMine && !grid[x][y].isEnemy && !grid[x][y].isTree && !grid[x][y].isBush && !grid[x][y].isVegetation && !grid[x][y].isRock) {
                if (Math.random() < 0.01) {
                    grid[x][y].isChest = true;
                    grid[x][y].chestLvl = Math.max(1, Math.floor(dist / 4));
                    destinations.push({ x: x, y: y });
                }
            }
        }
    }

    // 4.5. Генерация каменных тропинок от центра к сундукам и к краям
    if (destinations.length < 3) {
        destinations.push({ x: 0, y: Math.floor(MAP_H / 2) });
        destinations.push({ x: MAP_W - 1, y: Math.floor(MAP_H / 2) });
        destinations.push({ x: Math.floor(MAP_W / 2), y: 0 });
        destinations.push({ x: Math.floor(MAP_W / 2), y: MAP_H - 1 });
    }

    function setCellAsPath(px, py) {
        let cell = grid[px][py];
        cell.tileType = 'stone';
        cell.tileX = Math.floor(Math.random() * 4);
        cell.tileY = Math.floor(Math.random() * 4);
        cell.isTree = false;
        cell.isBush = false;
        cell.isVegetation = false;
        cell.isRock = false;
    }

    function makeStonePath(startX, startY, endX, endY) {
        let cx = startX;
        let cy = startY;
        let steps = 0;
        const maxSteps = MAP_W * MAP_H;
        
        while ((cx !== endX || cy !== endY) && steps < maxSteps) {
            steps++;
            let dx = Math.sign(endX - cx);
            let dy = Math.sign(endY - cy);
            
            if (dx !== 0 && dy !== 0) {
                if (Math.random() < 0.3) {
                    if (Math.random() < 0.5) cx += dx;
                    else cy += dy;
                } else {
                    cx += dx;
                    cy += dy;
                }
            } else if (dx !== 0) {
                cx += dx;
                if (Math.random() < 0.25 && cy > 0 && cy < MAP_H - 1) {
                    cy += Math.random() < 0.5 ? 1 : -1;
                }
            } else {
                cy += dy;
                if (Math.random() < 0.25 && cx > 0 && cx < MAP_W - 1) {
                    cx += Math.random() < 0.5 ? 1 : -1;
                }
            }
            
            cx = Math.max(0, Math.min(MAP_W - 1, cx));
            cy = Math.max(0, Math.min(MAP_H - 1, cy));
            setCellAsPath(cx, cy);
        }
    }

    destinations.forEach(dest => {
        makeStonePath(sX, sY, dest.x, dest.y);
    });

    // Гарантируем Safe Big Start:
    // Никаких мин в пределах 5х5 вокруг клика (чтобы все клетки 3х3 вокруг клика имели threatCount === 0)
    // Никаких врагов, сундуков, деревьев, кустов и прочих препятствий в пределах 3х3 вокруг клика
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let dx = Math.abs(x - sX);
            let dy = Math.abs(y - sY);
            if (dx <= 2 && dy <= 2) {
                grid[x][y].isMine = false;
            }
            if (dx <= 1 && dy <= 1) {
                grid[x][y].isEnemy = false;
                grid[x][y].enemyHp = 0;
                grid[x][y].isChest = false;
                grid[x][y].isTree = false;
                grid[x][y].isBush = false;
                grid[x][y].isRock = false;
                grid[x][y].isVegetation = false;
            }
        }
    }

    // 5. Подсчёт угроз
    recalcAllThreats();

    // Предварительная отрисовка статического фона для кэширования
    prerenderBackground();
}

function recalcAllThreats() {
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            recalcCellThreat(x, y);
        }
    }
}

function recalcThreatsAround(cx, cy) {
    for (let ax = Math.max(0, cx - 12); ax <= Math.min(MAP_W - 1, cx + 12); ax++) {
        for (let ay = Math.max(0, cy - 12); ay <= Math.min(MAP_H - 1, cy + 12); ay++) {
            recalcCellThreat(ax, ay);
        }
    }
}

function recalcCellThreat(x, y) {
    let cell = grid[x][y];
    if (cell.isMine) {
        cell.threatCount = 0;
        return;
    }
    let count = 0;
    for (let ax = Math.max(0, x - 1); ax <= Math.min(MAP_W - 1, x + 1); ax++) {
        for (let ay = Math.max(0, y - 1); ay <= Math.min(MAP_H - 1, y + 1); ay++) {
            if (ax === x && ay === y) continue;
            let neighbor = grid[ax][ay];
            if (neighbor.isMine) count++;
        }
    }
    cell.threatCount = count;
}

function isCellBlockedByEnemy(cx, cy) {
    for (let ax = Math.max(0, cx - 1); ax <= Math.min(MAP_W - 1, cx + 1); ax++) {
        for (let ay = Math.max(0, cy - 1); ay <= Math.min(MAP_H - 1, cy + 1); ay++) {
            let cell = grid[ax][ay];
            if (cell.isRevealed && cell.isEnemy && cell.enemyHp > 0) {
                if (ax === cx && ay === cy) return false;
                return true;
            }
        }
    }
    return false;
}

// --- КАМЕРА ---
// На мобильных уменьшаем внутренний вьюпорт канваса, чтобы клетки были крупнее
let isMobile = (window.innerWidth <= 640);
let VIEWPORT_W = isMobile ? 320 : 640;
let VIEWPORT_H = isMobile ? 320 : 640;
let cameraX = 0;
let cameraY = 0;

function clampCamera() {
    let maxX = MAP_W * CELL_SIZE - VIEWPORT_W;
    let maxY = MAP_H * CELL_SIZE - VIEWPORT_H;
    cameraX = Math.max(0, Math.min(cameraX, maxX));
    cameraY = Math.max(0, Math.min(cameraY, maxY));
}

function moveCamera(dx, dy) {
    cameraX += dx * CELL_SIZE;
    cameraY += dy * CELL_SIZE;
    clampCamera();
    drawBoard();
}

function centerCameraOnPlayer() {
    let sX = Math.floor(MAP_W / 2);
    let sY = Math.floor(MAP_H / 2);
    cameraX = sX * CELL_SIZE - Math.floor(VIEWPORT_W / 2 / CELL_SIZE) * CELL_SIZE;
    cameraY = sY * CELL_SIZE - Math.floor(VIEWPORT_H / 2 / CELL_SIZE) * CELL_SIZE;
    clampCamera();
    drawBoard();
}

// --- СИСТЕМА ОБЛАКОВ ---
let clouds = [];
window.cloudTextures = [];
window.cloudTexturesGenerated = false;

function generateCloudTextures() {
    if (window.cloudTexturesGenerated) return;
    if (!images.effect_smoke2 || !images.effect_smoke2.complete) return;

    window.cloudTextures = [];
    const frameW = 64;
    const frameH = 64;

    for (let i = 0; i < 4; i++) {
        let canvasTemp = document.createElement('canvas');
        canvasTemp.width = frameW;
        canvasTemp.height = frameH;
        let ctxTemp = canvasTemp.getContext('2d');

        // Рисуем i-й фрейм из спрайта дыма
        ctxTemp.drawImage(
            images.effect_smoke2,
            i * frameW, 0, frameW, frameH,
            0, 0, frameW, frameH
        );

        // Перекрашиваем силуэт в черный цвет для создания тени
        ctxTemp.globalCompositeOperation = 'source-in';
        ctxTemp.fillStyle = '#000000';
        ctxTemp.fillRect(0, 0, frameW, frameH);

        window.cloudTextures.push(canvasTemp);
    }
    window.cloudTexturesGenerated = true;
}

function initClouds() {
    clouds = [];
    
    // Пытаемся подготовить текстуры при инициализации облаков
    generateCloudTextures();

    let count = 8;
    for (let i = 0; i < count; i++) {
        clouds.push({
            x: Math.random() * (MAP_W * CELL_SIZE),
            y: Math.random() * (MAP_H * CELL_SIZE),
            size: 300 + Math.random() * 300, // Делаем облака еще больше
            opacity: 0.01 + Math.random() * 0.02, // Еще прозрачнее для максимальной мягкости
            vx: 0.15 + Math.random() * 0.25, 
            vy: 0.08 + Math.random() * 0.12,
            textureIndex: Math.floor(Math.random() * 4)
        });
    }
}

function updateClouds(dt) {
    let mapW = MAP_W * CELL_SIZE;
    let mapH = MAP_H * CELL_SIZE;
    clouds.forEach(cloud => {
        cloud.x += cloud.vx * dt;
        cloud.y += cloud.vy * dt;
        
        if (cloud.x > mapW + cloud.size) {
            cloud.x = -cloud.size;
            cloud.y = Math.random() * mapH;
        }
        if (cloud.y > mapH + cloud.size) {
            cloud.y = -cloud.size;
            cloud.x = Math.random() * mapW;
        }
    });
}

function drawCloudShadows() {
    // Если картинка не успела загрузиться при старте, пробуем сгенерировать текстуры сейчас
    if (!window.cloudTexturesGenerated) {
        generateCloudTextures();
    }

    clouds.forEach(cloud => {
        let screenX = cloud.x - cameraX;
        let screenY = cloud.y - cameraY;

        if (screenX + cloud.size >= 0 && screenX - cloud.size <= VIEWPORT_W &&
            screenY + cloud.size >= 0 && screenY - cloud.size <= VIEWPORT_H) {
            
            ctx.save();
            ctx.globalAlpha = cloud.opacity;
            // Включаем сглаживание для мягкого размытия тени облака
            ctx.imageSmoothingEnabled = true;

            let texture = window.cloudTextures[cloud.textureIndex];
            if (texture) {
                ctx.drawImage(
                    texture,
                    screenX - cloud.size / 2,
                    screenY - cloud.size / 2,
                    cloud.size,
                    cloud.size
                );
            } else {
                // Запасной вариант: градиент
                let grad = ctx.createRadialGradient(
                    screenX, screenY, 0,
                    screenX, screenY, cloud.size / 2
                );
                grad.addColorStop(0, 'rgba(0,0,0,0.4)');
                grad.addColorStop(1, 'rgba(0,0,0,0)');
                ctx.fillStyle = grad;
                ctx.beginPath();
                ctx.arc(screenX, screenY, cloud.size / 2, 0, Math.PI * 2);
                ctx.fill();
            }
            
            // Возвращаем сглаживание обратно для пиксель-арта игры
            ctx.imageSmoothingEnabled = false;
            ctx.restore();
        }
    });
}

// --- АНИМАЦИОННЫЕ ЭФФЕКТЫ ---
let activeEffects = [];

function addEffect(type, cx, cy, delay = 0) {
    let effect = {
        type: type,
        cx: cx,
        cy: cy,
        startTime: Date.now() + delay,
        delay: delay
    };
    
    if (type === 'expo') {
        effect.image = images.effect_expo;
        effect.frameCount = 9;
        effect.frameW = 96;
        effect.frameH = 96;
        effect.duration = 450;
        effect.rotation = Math.random() * Math.PI * 2;
        effect.scale = 0.9 + Math.random() * 0.4;
    } else if (type === 'expo2') {
        effect.image = images.effect_expo2;
        effect.frameCount = 9;
        effect.frameW = 48;
        effect.frameH = 48;
        effect.duration = 450;
        effect.rotation = Math.random() * Math.PI * 2;
        effect.scale = 0.9 + Math.random() * 0.4;
    } else if (type === 'spell') {
        effect.image = images.effect_spell;
        effect.frameCount = 7;
        effect.frameW = 128;
        effect.frameH = 128;
        effect.duration = 420;
        effect.rotation = Math.random() * Math.PI * 2;
        effect.scale = 0.9 + Math.random() * 0.3;
    } else if (type === 'sword') {
        effect.image = images.effect_sword;
        effect.frameCount = 8;
        effect.frameW = 80;
        effect.frameH = 80;
        effect.duration = 320;
        effect.rotation = Math.random() * Math.PI * 2;
        effect.scale = 0.8 + Math.random() * 0.4;
    } else if (type === 'click') {
        effect.image = images.effect_click;
        effect.frameCount = 12;
        effect.frameW = 64;
        effect.frameH = 64;
        effect.duration = 360;
        effect.opacity = 0.5; // 50% прозрачности
        effect.rotation = Math.random() * Math.PI * 2;
        effect.scale = 0.45 + Math.random() * 0.1;
    } else if (type === 'smoke') {
        effect.image = images.effect_smoke;
        effect.frameCount = 12;
        effect.frameW = 64;
        effect.frameH = 64;
        effect.duration = 600;
        effect.rotation = Math.random() * Math.PI * 2;
        effect.scale = 0.8 + Math.random() * 0.4;
    } else if (type === 'smoke2') {
        effect.image = images.effect_smoke2;
        effect.frameCount = 16;
        effect.frameW = 64;
        effect.frameH = 64;
        effect.duration = 800;
        effect.rotation = Math.random() * Math.PI * 2;
        effect.scale = 0.8 + Math.random() * 0.4;
    }
    
    activeEffects.push(effect);
}

function triggerMineExplosions(cx, cy) {
    // 1. Главный взрыв по центру
    addEffect('expo', cx, cy);
    // 2. Дополнительные взрывы с разной задержкой
    addEffect('expo2', cx, cy, 80);
    addEffect(Math.random() < 0.5 ? 'expo' : 'expo2', cx, cy, 160);
}

function processNewlyRevealedCells() {
    window.newlyRevealedCells = [];
}

function drawEffects() {
    let now = Date.now();
    for (let i = activeEffects.length - 1; i >= 0; i--) {
        let fx = activeEffects[i];
        if (now < fx.startTime) {
            // Эффект еще не начался (задержка)
            continue;
        }
        let elapsed = now - fx.startTime;
        if (elapsed >= fx.duration) {
            activeEffects.splice(i, 1);
            continue;
        }
        
        let progress = elapsed / fx.duration;
        let currentFrame = Math.floor(progress * fx.frameCount);
        currentFrame = Math.min(currentFrame, fx.frameCount - 1);
        
        let px = fx.cx * CELL_SIZE - cameraX;
        let py = fx.cy * CELL_SIZE - cameraY;
        
        let drawW = fx.frameW * (fx.scale || 1.0);
        let drawH = fx.frameH * (fx.scale || 1.0);
        
        if (px + drawW >= 0 && px - drawW <= canvas.width &&
            py + drawH >= 0 && py - drawH <= canvas.height) {
            
            let centerX = px + CELL_SIZE / 2;
            let centerY = py + CELL_SIZE / 2;
            
            if (fx.image && fx.image.complete) {
                ctx.save();
                if (fx.opacity !== undefined) {
                    ctx.globalAlpha = fx.opacity;
                }
                ctx.translate(centerX, centerY);
                if (fx.rotation) {
                    ctx.rotate(fx.rotation);
                }
                ctx.drawImage(
                    fx.image,
                    currentFrame * fx.frameW, 0, fx.frameW, fx.frameH,
                    -drawW / 2, -drawH / 2, drawW, drawH
                );
                ctx.restore();
            }
        }
    }
}

// --- ОТРИСОВКА ПОЛЯ ---
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');
canvas.width = VIEWPORT_W;
canvas.height = VIEWPORT_H;
ctx.imageSmoothingEnabled = false;

// Обработка смены ориентации / ресайза на мобильных
window.addEventListener('resize', () => {
    const nowMobile = (window.innerWidth <= 640);
    if (isMobile !== nowMobile) {
        isMobile = nowMobile;
        VIEWPORT_W = isMobile ? 320 : 640;
        VIEWPORT_H = isMobile ? 320 : 640;
        canvas.width = VIEWPORT_W;
        canvas.height = VIEWPORT_H;
        ctx.imageSmoothingEnabled = false;
        if (gameState === 'RAID') {
            clampCamera();
            drawBoard();
        }
    }
});

function drawBoard() {
    if (gameState !== 'RAID') return;

    // Обновление позиций облаков
    let now = Date.now();
    let dt = 1;
    if (window.lastCloudUpdate) {
        dt = (now - window.lastCloudUpdate) / 16;
    }
    window.lastCloudUpdate = now;
    if (typeof updateClouds === 'function') {
        updateClouds(dt);
    }

    // Сначала очищаем весь холст
    ctx.clearRect(0, 0, VIEWPORT_W, VIEWPORT_H);

    // Рисуем предрассчитанный статический фон земли из кеша
    if (window.bgCanvas) {
        ctx.drawImage(window.bgCanvas, cameraX, cameraY, VIEWPORT_W, VIEWPORT_H, 0, 0, VIEWPORT_W, VIEWPORT_H);
    } else {
        // Фоновый залив, если кеш не готов
        ctx.fillStyle = '#263238';
        ctx.fillRect(0, 0, VIEWPORT_W, VIEWPORT_H);
    }

    // Рисуем тени облаков поверх чистой земли, под остальными плитками и объектами
    if (typeof drawCloudShadows === 'function') {
        drawCloudShadows();
    }

    let startX = Math.floor(cameraX / CELL_SIZE);
    let startY = Math.floor(cameraY / CELL_SIZE);

    let endX = Math.min(MAP_W - 1, Math.ceil((cameraX + VIEWPORT_W) / CELL_SIZE) + 1);
    let endY = Math.min(MAP_H - 1, Math.ceil((cameraY + VIEWPORT_H) / CELL_SIZE) + 1);

    for (let x = startX; x <= endX; x++) {
        for (let y = startY; y <= endY; y++) {
            let cell = grid[x][y];
            let px = Math.floor(x * CELL_SIZE - cameraX);
            let py = Math.floor(y * CELL_SIZE - cameraY);

            if (cell.isRevealed) {
                // Земля уже отрисована из кеша bgCanvas

                // --- ТЕНЬ ОТ НЕРАЗВЕДАННЫХ КЛЕТОК ---
                // Рисуем очень легкую полупрозрачную тень (4px) на границе с туманом войны
                ctx.fillStyle = 'rgba(0, 0, 0, 0.12)';
                if (y > 0 && !grid[x][y - 1].isRevealed) {
                    ctx.fillRect(px, py, CELL_SIZE, 4); // Сверху
                }
                if (y < MAP_H - 1 && !grid[x][y + 1].isRevealed) {
                    ctx.fillRect(px, py + CELL_SIZE - 4, CELL_SIZE, 4); // Снизу
                }
                if (x > 0 && !grid[x - 1][y].isRevealed) {
                    ctx.fillRect(px, py, 4, CELL_SIZE); // Слева
                }
                if (x < MAP_W - 1 && !grid[x + 1][y].isRevealed) {
                    ctx.fillRect(px + CELL_SIZE - 4, py, 4, CELL_SIZE); // Справа
                }

                // Проверяем, наведён ли курсор мыши на эту конкретную клетку
                let isHovered = (x === window.hoveredCellX && y === window.hoveredCellY);
                let hasNumber = !cell.isMine && cell.threatCount > 0;

                // 3. Кусты, камни и вегетация
                let rustleAngle = 0;
                if (cell.rustleStartTime) {
                    let elapsed = Date.now() - cell.rustleStartTime;
                    let duration = 800;
                    if (elapsed < duration) {
                        let progress = elapsed / duration;
                        let maxAngle = cell.isTree ? 0.08 : (cell.isBush ? 0.15 : 0.22);
                        rustleAngle = Math.sin(progress * Math.PI * 3) * (1 - progress) * maxAngle * (cell.rustleDir || 1);
                    } else {
                        delete cell.rustleStartTime;
                        delete cell.rustleDir;
                    }
                }

                if (cell.isBush) {
                    let uniqueSpeedModifier = 0.8 + (Math.abs(Math.sin(x * 12.3 + y * 7.7)) * 0.4);
                    let time = Date.now() * 0.003 * uniqueSpeedModifier * 0.7; // 30% slower
                    let wave = Math.sin(time + (x * 0.5 + y * 0.3)) * 0.012 + rustleAngle;

                    if (images.bush.complete) {
                        ctx.save();
                        ctx.translate(px + CELL_SIZE / 2, py + CELL_SIZE);
                        ctx.rotate(wave);
                        ctx.drawImage(images.bush, -CELL_SIZE / 2, -CELL_SIZE, CELL_SIZE, CELL_SIZE);
                        ctx.restore();
                    } else {
                        ctx.fillStyle = '#2e7d32';
                        ctx.fillRect(px + 4, py + 4, 24, 24);
                    }
                }

                if (cell.isRock) {
                    let rockSize = 22; // 30% smaller than 32
                    let rockX = px + CELL_SIZE / 2 - rockSize / 2;
                    let rockY = py + 24 - rockSize; // rest slightly below center

                    if (images.rock.complete) {
                        ctx.drawImage(images.rock, cell.decorFrame * 16, 0, 16, 16, rockX, rockY, rockSize, rockSize);
                    } else {
                        ctx.fillStyle = '#757575';
                        ctx.fillRect(rockX, rockY, rockSize, rockSize);
                    }
                }

                if (cell.isVegetation) {
                    let uniqueSpeedModifier = 0.8 + (Math.abs(Math.sin(x * 12.3 + y * 7.7)) * 0.4);
                    let time = Date.now() * 0.003 * uniqueSpeedModifier * 0.7; // 30% slower
                    let wave = Math.sin(time + (x * 0.5 + y * 0.3)) * 0.018 + rustleAngle; // 1.5x stronger amplitude

                    if (images.vegetation.complete) {
                        // Используем детерминированный генератор случайных чисел по координатам (x, y)
                        let seed = x * 37 + y * 101;
                        function rnd() {
                            seed = (seed * 9301 + 49297) % 233280;
                            return seed / 233280;
                        }

                        // Количество травинок в клетке (от 2 до 4 для густоты)
                        let count = 2 + Math.floor(rnd() * 3);
                        for (let i = 0; i < count; i++) {
                            // Небольшое смещение для каждой травинки
                            let offsetX = (rnd() - 0.5) * (CELL_SIZE * 0.5);
                            let offsetY = (rnd() - 0.5) * (CELL_SIZE * 0.4);

                            // Случайный размер травинки (от 9 до 17 пикселей)
                            let size = 9 + rnd() * 8;

                            // Случайный фрейм из спрайтлиста (от 0 до 3)
                            let frame = Math.floor(rnd() * 4);

                            ctx.save();
                            // Точка вращения травинки (у основания)
                            ctx.translate(px + CELL_SIZE / 2 + offsetX, py + 22 + offsetY);
                            ctx.rotate(wave);
                            ctx.drawImage(
                                images.vegetation,
                                frame * 16, 0, 16, 16,
                                -size / 2, -size,
                                size, size
                            );
                            ctx.restore();
                        }
                    } else {
                        ctx.fillStyle = '#558b2f';
                        ctx.fillRect(px + 8, py + 8, 16, 16);
                    }
                }

                // 3. Деревья (с анимацией ЛЕГКОГО покачивания — сила уменьшена в 5 раз)
                // 3. Деревья (с индивидуальной скоростью покачивания, фазовым сдвигом и органическим смещением)
                if (cell.isTree) {
                    // Используем детерминированный генератор случайных чисел для смещения дерева
                    let seed = x * 157 + y * 223;
                    function treeRnd() {
                        seed = (seed * 9301 + 49297) % 233280;
                        return seed / 233280;
                    }

                    // Смещение дерева (по горизонтали от -6 до +6 пикселей, по вертикали от -4 до +4 пикселей)
                    let treeOffsetX = (treeRnd() - 0.5) * 12;
                    let treeOffsetY = (treeRnd() - 0.5) * 8;

                    // Генерируем псевдорандомный, но фиксированный для этой клетки множитель скорости (от 0.8 до 1.2)
                    let uniqueSpeedModifier = 0.8 + (Math.abs(Math.sin(x * 12.3 + y * 7.7)) * 0.4);

                    // Рассчитываем время с учетом индивидуальной скорости дерева
                    let time = Date.now() * 0.003 * uniqueSpeedModifier;

                    // Создаем волну с индивидуальной фазой и амплитудой 0.012 (в 5 раз слабее изначальной)
                    let wave = Math.sin(time + (x * 0.5 + y * 0.3)) * 0.012 + rustleAngle;

                    if (images.tree.complete) {
                        ctx.save();
                        // Сдвигаем матрицу к основанию ствола дерева с учетом его смещения
                        ctx.translate(px + CELL_SIZE / 2 + treeOffsetX, py + CELL_SIZE + treeOffsetY);
                        ctx.rotate(wave);

                        // Рисуем дерево со смещением обратно (так как точка привязки теперь по центру снизу)
                        ctx.drawImage(images.tree, cell.treeFrame * 32, 0, 32, 48, -CELL_SIZE / 2, -48, 32, 48);
                        ctx.restore();
                    } else {
                        ctx.fillStyle = '#1b5e20';
                        ctx.fillRect(px + 8 + treeOffsetX, py + 4 + treeOffsetY, 16, 24);
                    }
                }

                // --- АФТЕРБУМЫ И ТРУПЫ (РИСУЮТСЯ ПОД ЦИФРАМИ) ---
                if (cell.afterboomIndex !== undefined && cell.afterboomIndex !== null) {
                    ctx.save();
                    ctx.globalAlpha = 0.6;
                    if (images.afterboom && images.afterboom.complete) {
                        let frameW = images.afterboom.width / 3;
                        let frameH = images.afterboom.height;
                        ctx.drawImage(
                            images.afterboom,
                            cell.afterboomIndex * frameW, 0, frameW, frameH,
                            px, py, CELL_SIZE, CELL_SIZE
                        );
                    } else {
                        ctx.fillStyle = 'rgba(40, 40, 40, 0.6)';
                        ctx.beginPath();
                        ctx.arc(px + CELL_SIZE/2, py + CELL_SIZE/2, CELL_SIZE/3, 0, Math.PI*2);
                        ctx.fill();
                    }
                    ctx.restore();
                }

                if (cell.corpseType) {
                    let corpseImg = cell.corpseType === 'orc' ? images.orc_death : images.soldier_death;
                    if (corpseImg && corpseImg.complete) {
                        ctx.save();
                        ctx.globalAlpha = 0.75;
                        ctx.drawImage(corpseImg, px, py, CELL_SIZE, CELL_SIZE);
                        ctx.restore();
                    } else {
                        ctx.save();
                        ctx.globalAlpha = 0.75;
                        ctx.fillStyle = cell.corpseType === 'orc' ? '#990000' : '#000099';
                        ctx.fillRect(px + 6, py + 12, 20, 10);
                        ctx.restore();
                    }
                }

                // 4. Отрисовка цифры угрозы (всегда рисуется поверх декора и деревьев)
                if (hasNumber) {
                    drawThreatNumber(px, py, cell.threatCount, x, y);
                }

                // 5. Сундуки
                if (cell.isChest) {
                    if (images.chest_obj.complete) ctx.drawImage(images.chest_obj, px, py, CELL_SIZE, CELL_SIZE);
                    else { ctx.fillStyle = '#8d6e63'; ctx.fillRect(px + 6, py + 6, 20, 20); }
                }

                // 6. Враги
                if (cell.isEnemy && cell.enemyHp > 0) {
                    let eImg = cell.enemyType === 'orc'
                        ? (cell.isHurt ? images.orc_hurt : images.orc)
                        : (cell.isHurt ? images.soldier_hurt : images.soldier);
                    if (eImg && eImg.complete) {
                        ctx.drawImage(eImg, px, py, CELL_SIZE, CELL_SIZE);
                    } else {
                        ctx.fillStyle = cell.enemyType === 'orc' ? '#e53935' : '#3949ab';
                        ctx.fillRect(px + 4, py + 4, 24, 24);
                    }
                    ctx.fillStyle = '#ffcc00'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
                    ctx.fillText('L' + cell.lvl, px + 2, py + 10);

                    // Отрисовка ХП-бара врага
                    let maxHp = cell.lvl * (cell.enemyType === 'orc' ? 20 : 10);
                    let hpPercent = Math.max(0, Math.min(1, cell.enemyHp / maxHp));
                    
                    let barW = 24;
                    let barH = 3;
                    let barX = px + (CELL_SIZE - barW) / 2;
                    let barY = py + 27; // У нижней границы тайла
                    
                    // Черная подложка
                    ctx.fillStyle = '#000000';
                    ctx.fillRect(barX, barY, barW, barH);
                    
                    // Зеленое/Красное заполнение ХП
                    ctx.fillStyle = hpPercent > 0.5 ? '#4caf50' : '#ef5350';
                    ctx.fillRect(barX, barY, Math.round(barW * hpPercent), barH);
                }
            } else {
                // Неоткрытые плитки (туман войны)
                ctx.fillStyle = '#37474f';
                ctx.fillRect(px, py, CELL_SIZE, CELL_SIZE);
                ctx.strokeStyle = '#263238';
                ctx.strokeRect(px, py, CELL_SIZE, CELL_SIZE);
                if (cell.isFlagged) {
                    if (images.flag && images.flag.complete) {
                        ctx.drawImage(images.flag, px, py, CELL_SIZE, CELL_SIZE);
                    } else {
                        ctx.fillStyle = '#ef5350';
                        ctx.beginPath(); ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 6, 0, Math.PI * 2); ctx.fill();
                    }
                }
            }
        }
    }
    // --- ОФФ-СКРИН ИНДИКАТОРЫ ВРАГОВ (КРАСНЫЕ ПОЛОСКИ НА КРАЯХ ЭКРАНА) ---
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let cell = grid[x][y];

            // Ищем только открытых и живых врагов
            if (cell.isRevealed && cell.isEnemy && cell.enemyHp > 0) {

                // Вычисляем координаты центра врага относительно экрана
                let ex = (x * CELL_SIZE + CELL_SIZE / 2) - cameraX;
                let ey = (y * CELL_SIZE + CELL_SIZE / 2) - cameraY;

                // Проверяем, ушёл ли враг за пределы видимости камеры
                let isOffScreen = ex < 0 || ex > VIEWPORT_W || ey < 0 || ey > VIEWPORT_H;

                if (isOffScreen) {
                    let isTop = ey < 0;
                    let isBottom = ey > VIEWPORT_H;
                    let isLeft = ex < 0;
                    let isRight = ex > VIEWPORT_W;

                    // Прижимаем координаты индикатора строго к границам экрана
                    let indX = Math.max(0, Math.min(VIEWPORT_W - 8, ex));
                    let indY = Math.max(0, Math.min(VIEWPORT_H - 8, ey));

                    ctx.fillStyle = '#ff5252'; // Ярко-красный цвет индикатора

                    // Рисуем горизонтальную полоску сверху или снизу экрана
                    if (isTop || isBottom) {
                        ctx.fillRect(indX - 16, isTop ? 0 : VIEWPORT_H - 8, 32, 8);
                    }

                    // Рисуем вертикальную полоску слева или справа
                    if (isLeft || isRight) {
                        ctx.fillRect(isLeft ? 0 : VIEWPORT_W - 8, indY - 16, 8, 32);
                    }
                }
            }
        }
    }
    // Отрисовка ауры врагов поверх всего
    let auraStartX = Math.max(0, startX - 1);
    let auraStartY = Math.max(0, startY - 1);
    let auraEndX = Math.min(MAP_W - 1, endX + 1);
    let auraEndY = Math.min(MAP_H - 1, endY + 1);

    for (let x = auraStartX; x <= auraEndX; x++) {
        for (let y = auraStartY; y <= auraEndY; y++) {
            let cell = grid[x][y];
            if (cell.isRevealed && cell.isEnemy && cell.enemyHp > 0) {
                ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
                for (let ax = Math.max(0, x - 1); ax <= Math.min(MAP_W - 1, x + 1); ax++) {
                    for (let ay = Math.max(0, y - 1); ay <= Math.min(MAP_H - 1, y + 1); ay++) {
                        if (ax !== x || ay !== y) {
                            ctx.fillRect(ax * CELL_SIZE - cameraX, ay * CELL_SIZE - cameraY, CELL_SIZE, CELL_SIZE);
                        }
                    }
                }
            }
        }
    }
    
    // Отрисовка активных анимационных эффектов поверх всего
    // Отрисовка подсветки соседей при наведении (Hover Highlight)
    if (window.hoveredCellX !== undefined && window.hoveredCellX !== null && window.hoveredCellX >= 0 && window.hoveredCellX < MAP_W &&
        window.hoveredCellY !== undefined && window.hoveredCellY !== null && window.hoveredCellY >= 0 && window.hoveredCellY < MAP_H) {
        let hoveredCell = grid[window.hoveredCellX][window.hoveredCellY];
        if (hoveredCell.isRevealed) {
            ctx.save();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
            ctx.lineWidth = 1.5;
            for (let dx = -1; dx <= 1; dx++) {
                for (let dy = -1; dy <= 1; dy++) {
                    if (dx === 0 && dy === 0) continue;
                    let nx = window.hoveredCellX + dx;
                    let ny = window.hoveredCellY + dy;
                    if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) {
                        let px = nx * CELL_SIZE - cameraX;
                        let py = ny * CELL_SIZE - cameraY;
                        ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    }
                }
            }
            ctx.restore();
        }
    }

    // Отрисовка временной подсветки закрытых соседей при неудавшемся аккорде (Smart click feedback)
    if (window.tempChordingHighlight && (Date.now() - window.tempChordingHighlight.startTime < window.tempChordingHighlight.duration)) {
        let cx = window.tempChordingHighlight.cx;
        let cy = window.tempChordingHighlight.cy;
        ctx.save();
        ctx.strokeStyle = 'rgba(239, 83, 80, 0.6)'; // Красноватая полупрозрачная рамка для закрытых соседей
        ctx.lineWidth = 2;
        for (let dx = -1; dx <= 1; dx++) {
            for (let dy = -1; dy <= 1; dy++) {
                if (dx === 0 && dy === 0) continue;
                let nx = cx + dx;
                let ny = cy + dy;
                if (nx >= 0 && nx < MAP_W && ny >= 0 && ny < MAP_H) {
                    let adj = grid[nx][ny];
                    if (!adj.isRevealed) {
                        let px = nx * CELL_SIZE - cameraX;
                        let py = ny * CELL_SIZE - cameraY;
                        ctx.strokeRect(px + 1, py + 1, CELL_SIZE - 2, CELL_SIZE - 2);
                    }
                }
            }
        }
        ctx.restore();
    }

    // Отрисовка активных анимационных эффектов поверх всего
    drawEffects();
}

// Вспомогательная функция отрисовки кружка и цифры
function drawThreatNumber(px, py, threatCount, cx, cy) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)'; // Сделаем подложку чуть темнее для лучшей читаемости поверх дерева
    ctx.beginPath();
    ctx.arc(px + CELL_SIZE / 2, py + CELL_SIZE / 2, 10, 0, Math.PI * 2);
    ctx.fill();

    let isCompleted = false;
    if (cx !== undefined && cy !== undefined) {
        let flagsCount = 0;
        for (let ax = Math.max(0, cx - 1); ax <= Math.min(MAP_W - 1, cx + 1); ax++) {
            for (let ay = Math.max(0, cy - 1); ay <= Math.min(MAP_H - 1, cy + 1); ay++) {
                if (ax === cx && ay === cy) continue;
                if (grid[ax][ay].isFlagged) {
                    flagsCount++;
                }
            }
        }
        if (flagsCount === threatCount) {
            isCompleted = true;
        }
    }

    let colors = ['#78909c', '#1565c0', '#2e7d32', '#c62828', '#6a1b9a', '#ef6c00', '#00838f', '#37474f', '#000000'];
    ctx.fillStyle = isCompleted ? '#777777' : colors[Math.min(threatCount, colors.length - 1)];
    ctx.font = 'bold 16px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(threatCount, px + CELL_SIZE / 2, py + CELL_SIZE / 2);
}

function revealCell(x, y) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return;
    let cell = grid[x][y];
    if (cell.isRevealed || cell.isFlagged) return;

    cell.isRevealed = true;
    
    // Регенерация ХП за успешно открытый тайл (если не мина)
    if (!cell.isMine) {
        player.hp = Math.min(player.maxHp, player.hp + 0.1);
        if (typeof updateUi === 'function') {
            updateUi();
        }
    }
    
    // Эффект дыма на первой открытой клетке
    if (Math.random() < 0.4) {
        let smokeType = Math.random() < 0.5 ? 'smoke' : 'smoke2';
        addEffect(smokeType, x, y);
    }

    if (cell.isEnemy) return;

    if (cell.threatCount === 0 && !cell.isMine && !cell.isChest) {
        for (let ax = Math.max(0, x - 1); ax <= Math.min(MAP_W - 1, x + 1); ax++) {
            for (let ay = Math.max(0, y - 1); ay <= Math.min(MAP_H - 1, y + 1); ay++) {
                if (ax === x && ay === y) continue;
                revealCellDelayed(ax, ay, 40);
            }
        }
    }
}

function revealCellDelayed(x, y, delayMs) {
    if (x < 0 || x >= MAP_W || y < 0 || y >= MAP_H) return;
    let cell = grid[x][y];
    if (cell.isRevealed || cell.isFlagged) return;
    if (cell.isPendingReveal) return;

    cell.isPendingReveal = true;

    setTimeout(() => {
        if (gameState !== 'RAID') return;
        cell.isPendingReveal = false;
        if (cell.isRevealed || cell.isFlagged) return;

        cell.isRevealed = true;

        // Регенерация ХП за успешно открытый тайл (если не мина)
        if (!cell.isMine) {
            player.hp = Math.min(player.maxHp, player.hp + 0.1);
            if (typeof updateUi === 'function') {
                updateUi();
            }
        }

        if (Math.random() < 0.4) {
            let smokeType = Math.random() < 0.5 ? 'smoke' : 'smoke2';
            addEffect(smokeType, x, y);
        }

        drawBoard();
        checkVictoryCondition();

        if (cell.isEnemy) return;

        if (cell.threatCount === 0 && !cell.isMine && !cell.isChest) {
            for (let ax = Math.max(0, x - 1); ax <= Math.min(MAP_W - 1, x + 1); ax++) {
                for (let ay = Math.max(0, y - 1); ay <= Math.min(MAP_H - 1, y + 1); ay++) {
                    if (ax === x && ay === y) continue;
                    revealCellDelayed(ax, ay, 40);
                }
            }
        }
    }, delayMs);
}

// Отслеживание движения мыши для динамической прозрачности крон деревьев
canvas.addEventListener('mousemove', (e) => {
    if (gameState !== 'RAID') return;

    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    let cx = Math.floor(((e.clientX - rect.left) * scaleX + cameraX) / CELL_SIZE);
    let cy = Math.floor(((e.clientY - rect.top) * scaleY + cameraY) / CELL_SIZE);

    if (cx !== window.hoveredCellX || cy !== window.hoveredCellY) {
        if (cx >= 0 && cx < MAP_W && cy >= 0 && cy < MAP_H) {
            window.hoveredCellX = cx;
            window.hoveredCellY = cy;

            let cell = grid[cx][cy];
            if (cell && (cell.isTree || cell.isBush || cell.isVegetation)) {
                cell.rustleStartTime = Date.now();
                cell.rustleDir = Math.random() < 0.5 ? -1 : 1;
            }
        } else {
            window.hoveredCellX = -1;
            window.hoveredCellY = -1;
        }
        drawBoard();
    }
});

canvas.addEventListener('mouseleave', () => {
    window.hoveredCellX = -1;
    window.hoveredCellY = -1;
    drawBoard();
});

// Взаимодействие с полем
function handleBoardClick(cx, cy, isRightClick) {
    if (cx < 0 || cx >= MAP_W || cy < 0 || cy >= MAP_H) return;
    let cell = grid[cx][cy];

    if (window.activeScrollTargeting) {
        if (cell.isRevealed && cell.isEnemy && cell.enemyHp > 0) {
            let rollCount = cell.lvl;
            let rollResult = rollDice(rollCount, 20);
            let dmg = 50 + rollResult.sum;
            cell.enemyHp -= dmg;
            addEffect('spell', cx, cy);
            playSound('damagespell');
            logEvent(t('msg_scroll_dmg_log', { rolls: rollCount + 'd20 (' + rollResult.rolls.join('+') + ')', dmg: dmg, left: Math.max(0, cell.enemyHp) }), "log-loot");
            if (cell.enemyHp <= 0) {
                logEvent(t('enemy_killed_scroll'), 'log-loot');
                player.shards += cell.lvl * 2;
                if (window.raidStats) {
                    window.raidStats.enemiesKilled++;
                    window.raidStats.shardsLooted += cell.lvl * 2;
                }
                cell.corpseType = cell.enemyType;
                cell.isEnemy = false;
                recalcThreatsAround(cx, cy);
                checkVictoryCondition();
            }
            items.splice(window.scrollIndex, 1);
        } else {
            logEvent(t('msg_scroll_dmg_cancel'), "log-sys");
        }
        window.activeScrollTargeting = false;
        renderInventory();
        drawBoard();
        return;
    }

    let isAttackingEnemy = (cell.isRevealed && cell.isEnemy && cell.enemyHp > 0);

    if (!isAttackingEnemy) {
        if (isCellBlockedByEnemy(cx, cy)) {
            logEvent(t('msg_zone_controlled'), "log-error");
            return;
        }
    }

    // Установка флага
    if (isRightClick) {
        if (!cell.isRevealed) {
            cell.isFlagged = !cell.isFlagged;
            if (navigator.vibrate) {
                try {
                    navigator.vibrate(40);
                } catch (e) {}
            }
            playSound('button');
            drawBoard();
        }
        return;
    }

    if (cell.isFlagged) return;

    if (cell.isRevealed) {
        if (cell.isEnemy && cell.enemyHp > 0) {
            battleEnemy(cell, cx, cy);
            drawBoard();
            return;
        }
        if (cell.isChest) {
            lootChest(cell);
            cell.isChest = false;
            drawBoard();
            checkVictoryCondition();
            return;
        }

        // Chording (аккордовый клик)
        if (cell.threatCount > 0 && !cell.isMine) {
            let flaggedCount = 0;
            for (let ax = Math.max(0, cx - 1); ax <= Math.min(MAP_W - 1, cx + 1); ax++) {
                for (let ay = Math.max(0, cy - 1); ay <= Math.min(MAP_H - 1, cy + 1); ay++) {
                    if (grid[ax][ay].isFlagged) {
                        flaggedCount++;
                    }
                }
            }
            if (flaggedCount === cell.threatCount) {
                let hitMine = false;
                let revealedAny = false;
                for (let ax = Math.max(0, cx - 1); ax <= Math.min(MAP_W - 1, cx + 1); ax++) {
                    for (let ay = Math.max(0, cy - 1); ay <= Math.min(MAP_H - 1, cy + 1); ay++) {
                        let adj = grid[ax][ay];
                        if (!adj.isRevealed && !adj.isFlagged) {
                            if (isCellBlockedByEnemy(ax, ay)) continue;
                            revealedAny = true;
                            if (adj.isMine) {
                                adj.isRevealed = true;
                                adj.isMine = false;
                                adj.afterboomIndex = Math.floor(Math.random() * 3);
                                hitMine = true;
                                if (window.raidStats) window.raidStats.minesTriggered++;
                                playSound('boom' + (Math.floor(Math.random() * 2) + 1));
                                triggerMineExplosions(ax, ay);
                                if (!player.isInvulnerable) {
                                    player.hp -= 90;
                                    logEvent(t('mine_chord_hit'), "log-error");
                                } else {
                                    player.invulnCharges--;
                                    if (player.invulnCharges <= 0) {
                                        player.isInvulnerable = false;
                                        logEvent(t('scroll_ether_fail_chord'), "log-sys");
                                    } else {
                                        logEvent(t('scroll_ether_use_chord', { charges: player.invulnCharges }), "log-sys");
                                    }
                                }
                            } else {
                                revealCell(ax, ay);
                            }
                        }
                    }
                }
                if (hitMine) {
                    recalcThreatsAround(cx, cy);
                    if (player.hp <= 0) die();
                }
                if (revealedAny) {
                    playSound('button');
                    addEffect('click', cx, cy);
                    processNewlyRevealedCells();
                    drawBoard();
                    updateUi();
                    checkVictoryCondition();
                }
            } else {
                // Если флагов не хватает — подсвечиваем закрытые соседние клетки на 300мс
                window.tempChordingHighlight = {
                    cx: cx,
                    cy: cy,
                    startTime: Date.now(),
                    duration: 300
                };
                drawBoard();
                if (window.tempChordingTimer) clearTimeout(window.tempChordingTimer);
                window.tempChordingTimer = setTimeout(() => {
                    window.tempChordingHighlight = null;
                    drawBoard();
                }, 300);
            }
        }
        return;
    }

    if (firstClick) {
        firstClick = false;
        generateLevel(cx, cy);
    }

    if (cell.isMine) {
         cell.isRevealed = true;
         cell.isMine = false;
         cell.afterboomIndex = Math.floor(Math.random() * 3);
         if (window.raidStats) window.raidStats.minesTriggered++;
         playSound('boom' + (Math.floor(Math.random() * 2) + 1));
         triggerMineExplosions(cx, cy);
         recalcThreatsAround(cx, cy);
        if (player.isInvulnerable) {
            player.invulnCharges--;
            if (player.invulnCharges <= 0) {
                player.isInvulnerable = false;
                logEvent(t('scroll_ether_fail'), "log-sys");
            } else {
                logEvent(t('scroll_ether_use', { charges: player.invulnCharges }), "log-sys");
            }
        } else {
            player.hp -= 90;
            logEvent(t('mine_direct_hit'), "log-error");
            if (player.hp <= 0) die();
        }
        updateUi();
        drawBoard();
        checkVictoryCondition();
        return;
    }

    playSound('button');
    addEffect('click', cx, cy);
    revealCell(cx, cy);
    processNewlyRevealedCells();

    if (cell.isEnemy) {
        logEvent(t('threat_detected', { enemy: cell.enemyType === 'orc' ? t('enemy_orc') : t('enemy_soldier'), lvl: cell.lvl }), 'log-error');
    }
    drawBoard();
    checkVictoryCondition();
}

canvas.addEventListener('mousedown', (e) => {
    if (gameState !== 'RAID') return;
    window.newlyRevealedCells = [];
    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    let cx = Math.floor(((e.clientX - rect.left) * scaleX + cameraX) / CELL_SIZE);
    let cy = Math.floor(((e.clientY - rect.top) * scaleY + cameraY) / CELL_SIZE);
    handleBoardClick(cx, cy, e.button === 2);
});

// Добавляем поддержку Touch-событий (Tap и Long Press) для мобильных устройств
let touchStartX = 0;
let touchStartY = 0;
let touchStartCameraX = 0;
let touchStartCameraY = 0;
let touchTimer = null;
let isLongPress = false;
let touchMoved = false;

canvas.addEventListener('touchstart', (e) => {
    if (gameState !== 'RAID') return;
    if (e.touches.length !== 1) return;
    
    window.newlyRevealedCells = [];
    const touch = e.touches[0];
    touchStartX = touch.clientX;
    touchStartY = touch.clientY;
    touchStartCameraX = cameraX;
    touchStartCameraY = cameraY;
    isLongPress = false;
    touchMoved = false;
    
    if (touchTimer) clearTimeout(touchTimer);
    
    touchTimer = setTimeout(() => {
        isLongPress = true;
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        let cx = Math.floor(((touch.clientX - rect.left) * scaleX + cameraX) / CELL_SIZE);
        let cy = Math.floor(((touch.clientY - rect.top) * scaleY + cameraY) / CELL_SIZE);
        handleBoardClick(cx, cy, true); // Долгий тап ставит флаг
    }, 280); // Удержание пальца на 280мс
}, { passive: true });

canvas.addEventListener('touchmove', (e) => {
    if (gameState !== 'RAID') return;
    if (e.touches.length !== 1) return;
    
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    const dist = Math.hypot(dx, dy);
    
    if (dist > 15) {
        touchMoved = true;
        if (touchTimer) {
            clearTimeout(touchTimer);
            touchTimer = null;
        }
        
        // Сдвиг камеры при скролле (панорамирование пальцем)
        cameraX = touchStartCameraX - dx;
        cameraY = touchStartCameraY - dy;
        clampCamera();
        drawBoard();
    }
}, { passive: true });

canvas.addEventListener('touchend', (e) => {
    if (gameState !== 'RAID') return;
    
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    }
    
    if (isLongPress) {
        e.preventDefault();
        return;
    }
    
    if (!touchMoved) {
        e.preventDefault();
        let rect = canvas.getBoundingClientRect();
        let scaleX = canvas.width / rect.width;
        let scaleY = canvas.height / rect.height;
        const touch = e.changedTouches[0] || { clientX: touchStartX, clientY: touchStartY };
        let cx = Math.floor(((touch.clientX - rect.left) * scaleX + cameraX) / CELL_SIZE);
        let cy = Math.floor(((touch.clientY - rect.top) * scaleY + cameraY) / CELL_SIZE);
        handleBoardClick(cx, cy, false); // Обычный быстрый тап открывает клетку
    }
}, { passive: false });

canvas.addEventListener('contextmenu', e => e.preventDefault());

function battleEnemy(cell, cx, cy) {
    playSound('sword' + (Math.floor(Math.random() * 4) + 1));
    addEffect('sword', cx, cy);
    let rollResult = rollPlayerDamage();
    let dmg = rollResult.dmg;
    cell.enemyHp -= dmg;

    cell.isHurt = true;
    logEvent(t('msg_sword_combat_log', { notation: rollResult.notation, rolls: rollResult.rolls.join('+'), mod: rollResult.mod, dmg: dmg, left: Math.max(0, cell.enemyHp) }));
    drawBoard();

    setTimeout(() => {
        cell.isHurt = false;
        drawBoard();
    }, 150);

    if (cell.enemyHp <= 0) {
        logEvent(t('enemy_killed_combat'), 'log-loot');
        player.shards += cell.lvl * 2;
        if (window.raidStats) {
            window.raidStats.enemiesKilled++;
            window.raidStats.shardsLooted += cell.lvl * 2;
        }

        let dropChance = 0.05 + (cell.lvl * 0.02);
        if (Math.random() < dropChance) {
            cell.isChest = true;
            cell.chestLvl = cell.lvl;
            logEvent(t('chest_dropped', { lvl: cell.lvl }), 'log-loot');
        }

        cell.corpseType = cell.enemyType;
        cell.isEnemy = false;
        recalcThreatsAround(cx, cy);
        checkVictoryCondition();
    } else {
        if (player.isInvulnerable) {
            player.invulnCharges--;
            if (player.invulnCharges <= 0) {
                player.isInvulnerable = false;
                logEvent(t('scroll_ether_fail_combat'), "log-sys");
            } else {
                logEvent(t('scroll_ether_use_combat', { charges: player.invulnCharges }), "log-sys");
            }
        } else {
            let rollCount = cell.lvl;
            let diceSides = (cell.enemyType === 'orc') ? 20 : 12;
            let mod = cell.lvl * (cell.enemyType === 'orc' ? 8 : 2);
            let enemyRoll = rollDice(rollCount, diceSides);
            let rawDmg = enemyRoll.sum + mod;

            let playerDefense = getEquipStat('armor') + player.armor;
            let finalDmg = Math.max(1, rawDmg - playerDefense);
            player.hp -= finalDmg;
            logEvent(t('msg_enemy_attack_log', { rolls: rollCount + 'd' + diceSides + ' (' + enemyRoll.rolls.join('+') + ')', mod: mod, dmg: finalDmg, arm: playerDefense }), 'log-error');
            if (player.hp <= 0) die();
        }
        updateUi();
    }
}

function checkVictoryCondition() {
    let enemiesLeft = 0;
    let safeUnrevealed = 0;

    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let cell = grid[x][y];

            // Проверяем только живых врагов и неоткрытые безопасные клетки
            if (cell.isEnemy && cell.enemyHp > 0) enemiesLeft++;
            if (!cell.isMine && !cell.isRevealed) safeUnrevealed++;
        }
    }

    // Победа: убиты все враги и открыты все клетки без мин (сундуки игнорируются)
    if (enemiesLeft === 0 && safeUnrevealed === 0) {
        processRaidVictory();
    }
}

function processRaidVictory() {
    player.wins = (player.wins || 0) + 1;
    player.raidLevel = (player.raidLevel || 0) + 1;
    player.selectedRaidLevel = player.raidLevel;

    stopMusic();
    playSound('victory');

    items.forEach(it => { if (it.container === 'pockets') it.container = 'stash'; });

    if (typeof saveGame === 'function') {
        saveGame();
    }

    showHub();
    showCustomModal(
        t('msg_victory_text') + getRaidStatsSummary(),
        t('modal_title_victory')
    );
}

// --- СИСТЕМА НЕПРЕРЫВНОГО ДВИЖЕНИЯ КАМЕРЫ ---
window.cameraMoveInterval = null;

function startContinuousCameraMove(dx, dy) {
    if (window.cameraMoveInterval) clearInterval(window.cameraMoveInterval);

    playSound('button');
    moveCamera(dx, dy);

    window.cameraMoveInterval = setInterval(() => {
        moveCamera(dx, dy);
    }, 100);
}

function stopContinuousCameraMove() {
    if (window.cameraMoveInterval) {
        clearInterval(window.cameraMoveInterval);
        window.cameraMoveInterval = null;
    }
}

function lootChest(cell) {
    let lvl = cell.chestLvl || 1;
    let goldFound = (10 + Math.floor(Math.random() * 21)) * (1 + Math.floor(lvl / 3));
    player.gold += goldFound;

    if (window.raidStats) {
        window.raidStats.chestsOpened++;
        window.raidStats.goldLooted += goldFound;
    }

    playSound('chest' + (Math.floor(Math.random() * 2) + 1));

    let r = Math.random();
    let item = null;

    let redChance = 0.10 + (lvl * 0.015);
    let greenChance = 0.35 + (lvl * 0.01);

    if (r < 0.20) {
        let wR = Math.random();
        let rarity, nameKey, img, qualityVal;
        if (wR < redChance) {
            rarity = 'red';
            nameKey = 'name_royal_sword';
            img = 'swords3';
            qualityVal = Math.floor(Math.random() * 4) + 7;
        } else if (wR < redChance + greenChance) {
            rarity = 'green';
            nameKey = 'name_hardened_sword';
            img = 'swords2';
            qualityVal = Math.floor(Math.random() * 4) + 3;
        } else {
            rarity = 'white';
            nameKey = 'name_simple_sword';
            img = 'swords1';
            qualityVal = Math.floor(Math.random() * 3) + 1;
        }
        item = {
            id: 's_' + rarity + '_' + Date.now(),
            nameKey: nameKey,
            name: t(nameKey) + ` L${lvl}`,
            w: 1,
            h: 3,
            rarity: rarity,
            type: 'weapon',
            qualityVal: qualityVal,
            lvl: lvl,
            val: qualityVal * lvl,
            img: img
        };
    } else if (r < 0.40) {
        let aR = Math.random();
        let rarity, nameKey, img, qualityVal;
        if (aR < redChance) {
            rarity = 'red';
            nameKey = 'name_royal_armor';
            img = 'chest3';
            qualityVal = Math.floor(Math.random() * 4) + 7;
        } else if (aR < redChance + greenChance) {
            rarity = 'green';
            nameKey = 'name_knight_armor';
            img = 'chest2';
            qualityVal = Math.floor(Math.random() * 4) + 3;
        } else {
            rarity = 'white';
            nameKey = 'name_leather_armor';
            img = 'chest1';
            qualityVal = Math.floor(Math.random() * 3) + 1;
        }
        item = {
            id: 'a_' + rarity + '_' + Date.now(),
            nameKey: nameKey,
            name: t(nameKey) + ` L${lvl}`,
            w: 2,
            h: 2,
            rarity: rarity,
            type: 'armor',
            qualityVal: qualityVal,
            lvl: lvl,
            val: qualityVal * lvl,
            img: img
        };
    } else if (r < 0.60) {
        let hR = Math.random();
        if (hR < 0.5) {
            item = { id: 'food_' + Date.now(), nameKey: 'name_food', name: t('name_food'), w: 1, h: 1, rarity: 'white', type: 'food', img: 'f1' };
        } else if (hR < 0.85) {
            item = { id: 'p_small_' + Date.now(), nameKey: 'name_potion_small', name: t('name_potion_small'), w: 1, h: 1, rarity: 'white', type: 'potion_small', img: 'heal_small' };
        } else {
            item = { id: 'p_big_' + Date.now(), nameKey: 'name_potion_big', name: t('name_potion_big'), w: 1, h: 1, rarity: 'green', type: 'potion_big', img: 'heal_big' };
        }
    } else if (r < 0.85) {
        let sR = Math.random();
        if (sR < 0.6) {
            item = { id: 'scr_dmg_' + Date.now(), nameKey: 'name_scroll_dmg', name: t('name_scroll_dmg'), w: 1, h: 2, rarity: 'white', type: 'scroll_dmg', img: 'scroll_dmg' };
        } else {
            item = { id: 'scr_invis_' + Date.now(), nameKey: 'name_scroll_invis', name: t('name_scroll_invis'), w: 1, h: 2, rarity: 'green', type: 'scroll_invis', img: 'scroll_invis' };
        }
    } else {
        item = { id: 'scr_tp_' + Date.now(), nameKey: 'name_scroll_tp', name: t('name_scroll_tp'), w: 1, h: 2, rarity: 'red', type: 'scroll_tp', img: 'teleport' };
    }

    if (item) {
        let pos = findFreeSpace(item.w, item.h, 'pockets');
        if (pos) {
            item.x = pos.x; item.y = pos.y; item.container = 'pockets';
            items.push(item);
            logEvent(t('msg_found_item', { name: getItemName(item), gold: goldFound }));
            playSound('inventory');
            renderInventory();
        } else {
            player.gold -= goldFound;
            logEvent(t('msg_chest_full', { name: getItemName(item) }), 'log-error');
            cell.isChest = true;
        }
    }
}