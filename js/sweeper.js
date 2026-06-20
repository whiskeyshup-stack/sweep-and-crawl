// --- ОТРИСОВКА И СОБЫТИЯ САПЕРА (RENDER & EVENTS) ---

// --- ЛОГИКА САПЕРА ---

// Координаты клетки, на которую сейчас наведен курсор (для прозрачности деревьев)
window.hoveredCellX = -1;
window.hoveredCellY = -1;

// Вспомогательные функции для броска кубиков


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
    const pad = 16; // Отступы, чтобы размытые края не обрезались
    const tempW = frameW + pad * 2;
    const tempH = frameH + pad * 2;

    for (let i = 0; i < 4; i++) {
        let canvasTemp = document.createElement('canvas');
        canvasTemp.width = tempW;
        canvasTemp.height = tempH;
        let ctxTemp = canvasTemp.getContext('2d');

        // Применяем размытие к исходной картинке
        ctxTemp.filter = 'blur(4px)';

        // Рисуем i-й фрейм из спрайта дыма со сдвигом на величину отступа
        ctxTemp.drawImage(
            images.effect_smoke2,
            i * frameW, 0, frameW, frameH,
            pad, pad, frameW, frameH
        );

        // Отключаем фильтр для последующих операций наложения
        ctxTemp.filter = 'none';

        // Перекрашиваем силуэт в черный цвет для создания тени
        ctxTemp.globalCompositeOperation = 'source-in';
        ctxTemp.fillStyle = '#000000';
        ctxTemp.fillRect(0, 0, tempW, tempH);

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
            opacity: 0.05 + Math.random() * 0.03, // Диапазон от 5% до 8%
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
            
            ctx.restore();
        }
    });
}

// --- АНИМАЦИОННЫЕ ЭФФЕКТЫ ---
let activeEffects = [];

function addEffect(type, cx, cy, delay = 0, extra = null) {
    let effect = {
        type: type,
        cx: cx,
        cy: cy,
        startTime: Date.now() + delay,
        delay: delay
    };
    if (extra) {
        Object.assign(effect, extra);
    }
    
    if (type === 'floating_loot' || type === 'floating_damage') {
        effect.duration = 1000;
    } else if (type === 'expo') {
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
        
        if (fx.type === 'floating_loot') {
            ctx.save();
            ctx.globalAlpha = 1 - progress;

            let px = fx.cx * CELL_SIZE - cameraX + CELL_SIZE / 2;
            let py = fx.cy * CELL_SIZE - cameraY - progress * 45 + (fx.offsetY || 0); // float up 45px with optional offset

            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (fx.lootType === 'gold') {
                let text = `+${fx.amount}`;
                
                // Draw text shadow
                ctx.fillStyle = '#000000';
                ctx.fillText(text, px - 11, py + 1);
                
                // Draw text in gold color
                ctx.fillStyle = '#ffd700'; 
                ctx.fillText(text, px - 12, py);

                // Draw gold coin next to text
                let coinX = px + ctx.measureText(text).width / 2 + 2;
                let coinY = py;
                
                ctx.beginPath();
                ctx.arc(coinX, coinY, 5, 0, Math.PI * 2);
                ctx.fillStyle = '#ffd700';
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#b8860b';
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(coinX, coinY, 2.5, 0, Math.PI * 2);
                ctx.strokeStyle = '#ff8c00';
                ctx.stroke();

            } else if (fx.lootType === 'shards') {
                let text = `+${fx.amount}`;
                
                // Draw text shadow
                ctx.fillStyle = '#000000';
                ctx.fillText(text, px - 11, py + 1);
                
                // Draw text in purple color
                ctx.fillStyle = '#da70d6'; 
                ctx.fillText(text, px - 12, py);

                // Draw soul shard shape next to text
                let shardX = px + ctx.measureText(text).width / 2 + 2;
                let shardY = py;
                
                ctx.beginPath();
                ctx.moveTo(shardX, shardY - 6);
                ctx.lineTo(shardX + 4, shardY);
                ctx.lineTo(shardX, shardY + 6);
                ctx.lineTo(shardX - 4, shardY);
                ctx.closePath();
                ctx.fillStyle = '#ba55d3'; 
                ctx.fill();
                ctx.lineWidth = 1;
                ctx.strokeStyle = '#8a2be2'; 
                ctx.stroke();
            } else if (fx.lootType === 'item' && fx.item) {
                let name = getItemName(fx.item);
                
                let color = '#ffffff';
                if (fx.item.rarity === 'green') color = '#88ff88';
                else if (fx.item.rarity === 'red') color = '#ff5555';
                
                ctx.fillStyle = '#000000';
                ctx.fillText(name, px - 11, py + 1);
                
                ctx.fillStyle = color;
                ctx.fillText(name, px - 12, py);
                
                let imgKey = fx.item.img;
                let img = images[imgKey];
                if (img && img.complete) {
                    let iconW = 16;
                    let iconH = 16;
                    let iconX = px + ctx.measureText(name).width / 2 + 4;
                    let iconY = py - iconH / 2;
                    ctx.drawImage(img, iconX, iconY, iconW, iconH);
                }
            }
            
            ctx.restore();
            continue;
        } else if (fx.type === 'floating_damage') {
            ctx.save();
            ctx.globalAlpha = 1 - progress;

            let px = fx.cx * CELL_SIZE - cameraX + CELL_SIZE / 2;
            let py = fx.cy * CELL_SIZE - cameraY - progress * 40 - 5; 

            ctx.font = 'bold 12px "Press Start 2P", monospace, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            let text = `-${fx.amount}`;
            
            // Тень текста для читаемости
            ctx.fillStyle = '#000000';
            ctx.fillText(text, px + 1.5, py + 1.5);

            if (fx.isPlayer) {
                // Урон по игроку: красный
                ctx.fillStyle = '#ff3333';
            } else {
                // Урон по врагу: оранжевый
                ctx.fillStyle = '#ffaa00';
            }
            ctx.fillText(text, px, py);

            ctx.restore();
            continue;
        }

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
                    let maxHp = cell.lvl * (cell.enemyType === 'orc' ? 15 : 10); // Орк: 20→15
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
                // Неоткрытые плитки (туман войны — цвет темнее к краям)
                ctx.fillStyle = cell.fogShade || '#37474f';
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

    // --- ОТРИСОВКА ГРАНИЦ КАРТЫ ---
    ctx.save();
    // Внешняя черная обводка для контраста
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 6;
    ctx.strokeRect(-cameraX, -cameraY, MAP_W * CELL_SIZE, MAP_H * CELL_SIZE);
    
    // Внутренняя золотая линия
    ctx.strokeStyle = '#ffcc00';
    ctx.lineWidth = 2;
    ctx.strokeRect(-cameraX, -cameraY, MAP_W * CELL_SIZE, MAP_H * CELL_SIZE);
    ctx.restore();

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

    // Отрисовка миникарты
    drawMinimap();

    // Обновление счетчика добычи за рейд
    updateRaidLootCounter();
}

// Простая пиксельная миникарта
function drawMinimap() {
    const canvasMinimap = document.getElementById('minimapCanvas');
    if (!canvasMinimap || gameState !== 'RAID') return;
    const ctxM = canvasMinimap.getContext('2d');
    
    // Устанавливаем внутреннее разрешение миникарты равным количеству тайлов (MAP_W x MAP_H)
    canvasMinimap.width = MAP_W;
    canvasMinimap.height = MAP_H;
    
    ctxM.clearRect(0, 0, MAP_W, MAP_H);
    
    // Рисуем каждую клетку пиксель за пикселем
    for (let x = 0; x < MAP_W; x++) {
        for (let y = 0; y < MAP_H; y++) {
            let cell = grid[x][y];
            if (!cell) continue;
            
            if (cell.isRevealed) {
                if (cell.isMine) {
                    ctxM.fillStyle = '#ef5350'; // Красный (мина)
                } else if (cell.isChest) {
                    ctxM.fillStyle = '#ffcc00'; // Золотой (сундук)
                } else if (cell.isEnemy) {
                    ctxM.fillStyle = '#9c27b0'; // Фиолетовый (враг)
                } else {
                    ctxM.fillStyle = '#3e5c3f'; // Обычный зачищенный пол (зеленый)
                }
            } else if (cell.isFlagged) {
                ctxM.fillStyle = '#ffaa00'; // Оранжевый (флаг)
            } else {
                ctxM.fillStyle = '#1b262c'; // Тёмно-синий/чёрный (туман войны)
            }
            ctxM.fillRect(x, y, 1, 1);
        }
    }
    
    // Вычисляем границы отображения камеры в координатах сетки
    let camCellX = Math.floor(cameraX / CELL_SIZE);
    let camCellY = Math.floor(cameraY / CELL_SIZE);
    let camCellW = Math.ceil(VIEWPORT_W / CELL_SIZE);
    let camCellH = Math.ceil(VIEWPORT_H / CELL_SIZE);
    
    // Рисуем рамку вьюпорта камеры белым цветом
    ctxM.strokeStyle = '#ffffff';
    ctxM.lineWidth = 1;
    ctxM.strokeRect(camCellX + 0.5, camCellY + 0.5, camCellW - 1, camCellH - 1);
}

// Обновление отображения золота и осколков, найденных за рейд
function updateRaidLootCounter() {
    const goldEl = document.getElementById('raid-loot-gold');
    const shardsEl = document.getElementById('raid-loot-shards');
    
    if (window.raidStats) {
        if (goldEl) goldEl.innerHTML = `+${window.raidStats.goldLooted} <img src="Ui/Coin.png" class="ui-icon">`;
        if (shardsEl) shardsEl.innerHTML = `+${window.raidStats.shardsLooted} <img src="Ui/SoulShard.png" class="ui-icon">`;
    } else {
        if (goldEl) goldEl.innerHTML = `+0 <img src="Ui/Coin.png" class="ui-icon">`;
        if (shardsEl) shardsEl.innerHTML = `+0 <img src="Ui/SoulShard.png" class="ui-icon">`;
    }
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



