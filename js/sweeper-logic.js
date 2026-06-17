// --- СУПЕР-ЛОГИКА САПЕРА (CORE LOGIC) ---

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
                addEffect('floating_loot', cx, cy, 0, { lootType: 'shards', amount: cell.lvl * 2 });
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
            lootChest(cell, cx, cy);
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
        addEffect('floating_loot', cx, cy, 0, { lootType: 'shards', amount: cell.lvl * 2 });
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



function lootChest(cell, cx, cy) {
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
            addEffect('floating_loot', cx !== undefined ? cx : 0, cy !== undefined ? cy : 0, 0, { lootType: 'gold', amount: goldFound });
        } else {
            player.gold -= goldFound;
            logEvent(t('msg_chest_full', { name: getItemName(item) }), 'log-error');
            cell.isChest = true;
        }
    }
}

