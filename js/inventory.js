// --- ИНВЕНТАРЬ ---
function getEquipStat(type) {
    let containerName = (type === 'weapon') ? 'equip_sword' : `equip_${type}`;
    let equip = items.find(it => it.container === containerName);
    return equip ? equip.val : 0;
}

function findFreeSpace(w, h, containerName) {
    let gridDef = GRIDS[containerName];
    let map = Array(gridDef.w).fill(0).map(() => Array(gridDef.h).fill(false));

    items.filter(it => it.container === containerName).forEach(it => {
        for (let x = it.x; x < it.x + it.w; x++) {
            for (let y = it.y; y < it.y + it.h; y++) {
                if (x < gridDef.w && y < gridDef.h) map[x][y] = true;
            }
        }
    });

    for (let y = 0; y <= gridDef.h - h; y++) {
        for (let x = 0; x <= gridDef.w - w; x++) {
            let fits = true;
            for (let i = 0; i < w; i++) {
                for (let j = 0; j < h; j++) if (map[x + i][y + j]) fits = false;
            }
            if (fits) return { x, y };
        }
    }
    return null;
}

function renderInventory() {
    Object.values(GRIDS).forEach(g => g.el.innerHTML = '');

    items.forEach((item, index) => {
        let el = document.createElement('div');
        el.className = `inv-item rarity-${item.rarity}`;
        el.style.width = `${item.w * TILE_SIZE}px`;
        el.style.height = `${item.h * TILE_SIZE}px`;
        el.style.left = `${item.x * TILE_SIZE}px`;
        el.style.top = `${item.y * TILE_SIZE}px`;
        el.dataset.index = index;

        if (images[item.img] && images[item.img].complete) {
            let img = document.createElement('img');
            img.src = images[item.img].src;
            // Если предмет повернут, применяем CSS-трансформацию поворота
            if (item.isRotated) {
                img.style.position = 'absolute';
                img.style.left = '50%';
                img.style.top = '50%';
                img.style.width = `${item.h * TILE_SIZE}px`;
                img.style.height = `${item.w * TILE_SIZE}px`;
                img.style.transform = 'translate(-50%, -50%) rotate(90deg)';
            } else {
                img.style.width = '100%';
                img.style.height = '100%';
            }
            el.appendChild(img);
        } else {
            el.style.fontSize = '9px';
            el.innerText = getItemName(item).substring(0, 4);
        }

        // Открытие контекстного меню при правом клике
        el.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            if (!window.draggedItem && !window.dragPending) {
                showContextMenu(e, index);
            }
        });
        
        // DRAG AND DROP (кастомная реализация) и открытие меню на левый клик/тап
        if (!item.container.startsWith('equip_')) {
            el.addEventListener('mousedown', e => {
                if (e.button === 0) { // Только левый клик
                    e.preventDefault();
                    e.stopPropagation();
                    initDragOrClick(index, e);
                }
            });
            
            el.addEventListener('touchstart', e => {
                e.preventDefault();
                e.stopPropagation();
                initDragOrClick(index, e.touches[0]);
            }, { passive: false });
        } else {
            // Если вещь надета (экипирована), левый клик сразу открывает контекстное меню (её нельзя таскать)
            el.addEventListener('click', e => {
                e.preventDefault();
                e.stopPropagation();
                showContextMenu(e, index);
            });
            
            el.addEventListener('touchend', e => {
                e.preventDefault();
                e.stopPropagation();
                let touch = e.changedTouches[0];
                let fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {}, stopPropagation: () => {} };
                showContextMenu(fakeEvent, index);
            }, { passive: false });
        }

        GRIDS[item.container].el.appendChild(el);
    });
    updateUi();
}

function getItemDescription(item) {
    let html = '';
    let rarityColor = '#aaa';
    let rarityName = t('item_rarity_common');
    if (item.rarity === 'green') { rarityColor = '#4caf50'; rarityName = t('item_rarity_rare'); }
    if (item.rarity === 'red') { rarityColor = '#f44336'; rarityName = t('item_rarity_legendary'); }

    html += `<div style="font-size: 10px; font-weight: bold; color: ${rarityColor}; border-bottom: 1px solid #444; padding-bottom: 6px; margin-bottom: 8px;">${getItemName(item)}</div>`;
    html += `<div style="font-size: 7px; color: #888; margin-bottom: 6px;">${t('item_label', { rarity: rarityName })}</div>`;

    if (item.type === 'weapon') {
        html += `<div style="color: #ffcc00; font-size: 8px; margin-bottom: 4px;">${t('item_weapon_val', { val: item.val })}</div>`;
        if (item.qualityVal !== undefined) {
            html += `<div style="font-size: 7px; color: #aaa; margin-bottom: 4px;">${t('item_quality_lvl', { quality: item.qualityVal, lvl: item.lvl })}</div>`;
        }
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_weapon_desc')}</div>`;
    } else if (item.type === 'armor') {
        html += `<div style="color: #448aff; font-size: 8px; margin-bottom: 4px;">${t('item_armor_val', { val: item.val })}</div>`;
        if (item.qualityVal !== undefined) {
            html += `<div style="font-size: 7px; color: #aaa; margin-bottom: 4px;">${t('item_quality_lvl', { quality: item.qualityVal, lvl: item.lvl })}</div>`;
        }
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_armor_desc')}</div>`;
    } else if (item.type === 'food') {
        html += `<div style="color: #8bc34a; font-size: 8px; margin-bottom: 4px;">${t('item_food_val')}</div>`;
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_food_desc')}</div>`;
    } else if (item.type === 'potion_small') {
        html += `<div style="color: #8bc34a; font-size: 8px; margin-bottom: 4px;">${t('item_potion_small_val')}</div>`;
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_potion_small_desc')}</div>`;
    } else if (item.type === 'potion_big') {
        html += `<div style="color: #8bc34a; font-size: 8px; margin-bottom: 4px;">${t('item_potion_big_val')}</div>`;
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_potion_big_desc')}</div>`;
    } else if (item.type === 'scroll_dmg') {
        html += `<div style="color: #ff5722; font-size: 8px; margin-bottom: 4px;">${t('item_scroll_dmg_val')}</div>`;
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_scroll_dmg_desc')}</div>`;
    } else if (item.type === 'scroll_invis') {
        html += `<div style="color: #00bcd4; font-size: 8px; margin-bottom: 4px;">${t('item_scroll_invis_val')}</div>`;
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_scroll_invis_desc')}</div>`;
    } else if (item.type === 'scroll_tp') {
        html += `<div style="color: #9c27b0; font-size: 8px; margin-bottom: 4px;">${t('item_scroll_tp_val')}</div>`;
        html += `<div style="margin-top: 8px; font-size: 7px; color: #bbb; line-height: 1.5;">${t('item_scroll_tp_desc')}</div>`;
    }

    return html;
}

// Контекстное меню предметов
function showContextMenu(e, index) {
    let menu = document.getElementById('inv-context-menu');
    if (!menu) return;

    menu.innerHTML = '';
    let item = items[index];

    // Кнопка "Использовать" / "Надеть" / "Снять"
    let actionBtn = document.createElement('div');
    actionBtn.className = 'context-menu-item';

    if (item.type === 'weapon' || item.type === 'armor') {
        if (item.container.startsWith('equip_')) {
            actionBtn.innerHTML = t('inv_ctx_unequip');
            actionBtn.onclick = () => {
                let targetContainer = (gameState === 'HUB') ? 'stash' : 'pockets';
                let pos = findFreeSpace(item.w, item.h, targetContainer);
                if (pos) {
                    item.x = pos.x; item.y = pos.y; item.container = targetContainer;
                    let destName = targetContainer === 'stash' ? t('inv_ctx_stash_dest') : t('inv_ctx_pockets_dest');
                    logEvent(t('inv_ctx_unequip_log', { name: getItemName(item), dest: destName }));
                    playSound('inventory');
                } else {
                    logEvent(t('inv_ctx_no_space'), 'log-error');
                }
                renderInventory();
            };
        } else {
            actionBtn.innerHTML = t('inv_ctx_equip');
            actionBtn.onclick = () => {
                let slotName = (item.type === 'weapon') ? 'equip_sword' : 'equip_armor';
                let currentEquip = items.find(it => it.container === slotName);
                if (currentEquip) {
                    // Меняем местами с текущей экипировкой
                    let oldX = item.x;
                    let oldY = item.y;
                    let oldContainer = item.container;

                    currentEquip.x = oldX;
                    currentEquip.y = oldY;
                    currentEquip.container = oldContainer;
                }
                
                // Сброс поворота при экипировке
                if (item.isRotated) {
                    let temp = item.w;
                    item.w = item.h;
                    item.h = temp;
                    item.isRotated = false;
                }

                item.x = 0;
                item.y = 0;
                item.container = slotName;
                logEvent(t('inv_ctx_equip_log', { name: getItemName(item) }));
                playSound('equip');
                renderInventory();
            };
        }
    } else {
        actionBtn.innerHTML = t('inv_ctx_use');
        actionBtn.onclick = () => {
            useConsumable(item, index);
        };
    }
    menu.appendChild(actionBtn);

    // Опция "Продать" (только в ХАБЕ)
    if (gameState === 'HUB') {
        let sellBtn = document.createElement('div');
        sellBtn.className = 'context-menu-item';
        let val = (item.rarity === 'red') ? 100 : (item.rarity === 'green' ? 30 : 10);
        sellBtn.innerHTML = t('inv_ctx_sell', { val: val });
        sellBtn.onclick = () => {
            player.gold += val;
            items.splice(index, 1);
            logEvent(t('inv_ctx_sell_log', { name: getItemName(item), val: val }));
            playSound('shop' + (Math.floor(Math.random() * 3) + 1));
            showHub();
        };
        menu.appendChild(sellBtn);
    }

    // Опция "Уничтожить" (только в РЕЙДЕ)
    if (gameState === 'RAID') {
        let destroyBtn = document.createElement('div');
        destroyBtn.className = 'context-menu-item';
        destroyBtn.innerHTML = t('inv_ctx_destroy_btn');
        destroyBtn.onclick = async () => {
            if (await showCustomModal(t('inv_ctx_destroy_confirm', { name: getItemName(item) }), t('inv_ctx_destroy_title'), true)) {
                items.splice(index, 1);
                logEvent(t('inv_ctx_destroy_log', { name: getItemName(item) }));
                renderInventory();
            }
        };
        destroyBtn.className = 'context-menu-item';
        menu.appendChild(destroyBtn);
    }

    // Позиционирование меню с учётом границ экрана
    let currentZoom = parseFloat(getComputedStyle(document.body).zoom) || 1.0;
    let menuX = e.clientX / currentZoom;
    let menuY = e.clientY / currentZoom;
    
    // Показываем меню сначала невидимо, чтобы измерить его размеры
    menu.style.left = '0px';
    menu.style.top = '0px';
    menu.style.display = 'block';
    let menuRect = menu.getBoundingClientRect();
    let menuW = menuRect.width / currentZoom;
    let menuH = menuRect.height / currentZoom;
    
    let docW = window.innerWidth / currentZoom;
    let docH = window.innerHeight / currentZoom;
    
    // Не даём меню вылезти за правый край
    if (menuX + menuW > docW) {
        menuX = docW - menuW - 10;
    }
    // Не даём вылезти за нижний край
    if (menuY + menuH > docH) {
        menuY = docH - menuH - 10;
    }
    // Не даём уйти за левый/верхний край
    menuX = Math.max(5, menuX);
    menuY = Math.max(5, menuY);
    
    menu.style.left = menuX + 'px';
    menu.style.top = menuY + 'px';

    // Отображение подробного тултипа
    let tooltip = document.getElementById('inv-item-tooltip');
    if (tooltip) {
        tooltip.innerHTML = getItemDescription(item);
        
        // На узких экранах — показываем тултип ПОД меню
        if (docW <= 640) {
            tooltip.style.left = Math.max(5, menuX) + 'px';
            tooltip.style.top = (menuY + menuH + 5) + 'px';
            tooltip.style.width = Math.min(230, docW - 20) + 'px';
        } else {
            // На десктопе — слева от меню
            tooltip.style.left = (menuX - 240) + 'px';
            tooltip.style.top = menuY + 'px';
            tooltip.style.width = '230px';
        }
        tooltip.style.display = 'block';
    }
}

async function useConsumable(item, index) {
    if (gameState !== 'RAID') {
        await showCustomModal(t('msg_cant_use_hub'));
        return;
    }
    if (item.container !== 'pockets') {
        await showCustomModal(t('msg_cant_use_stash'));
        return;
    }

    if (item.type === 'scroll_tp') {
        let choice = await showCustomModal(
            t('msg_tp_confirm'),
            t('modal_title_tp'),
            true
        );

        if (choice) {
            items.forEach(it => { if (it.container === 'pockets') it.container = 'stash'; });
            items.splice(index, 1); // Удаляем использованный свиток
            showHub();
            await showCustomModal(t('msg_tp_success') + getRaidStatsSummary(), t('modal_title_evac'));
        } else {
            logEvent(t('msg_tp_cancel'), "log-sys");
            renderInventory(); // Просто закрываем меню, свиток остаётся на месте
        }
    } else if (item.type === 'food') {
        let healPercent = 0.25 + Math.random() * 0.10; // Усилено: 10-15% →25-35%
        let healAmt = Math.round(player.maxHp * healPercent);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        logEvent(t('msg_food_log', { heal: healAmt }), "log-sys");
        playSound('eat');
        items.splice(index, 1);
        updateUi(); renderInventory();
    } else if (item.type === 'potion_small') {
        let healAmt = Math.round(player.maxHp * 0.50);
        player.hp = Math.min(player.maxHp, player.hp + healAmt);
        logEvent(t('msg_potion_small_log', { heal: healAmt }), "log-sys");
        playSound('inventory');
        items.splice(index, 1);
        updateUi(); renderInventory();
    } else if (item.type === 'potion_big') {
        player.hp = player.maxHp;
        logEvent(t('msg_potion_big_log'), "log-sys");
        playSound('inventory');
        items.splice(index, 1);
        updateUi(); renderInventory();
    } else if (item.type === 'scroll_invis') {
        player.isInvulnerable = true;
        player.invulnCharges = 3; // Ослаблено: 5→3 заряда
        logEvent(t('msg_scroll_invis_log'), "log-sys");
        playSound('holyspell');
        items.splice(index, 1);
        updateUi(); renderInventory();
    } else if (item.type === 'scroll_dmg') {
        window.activeScrollTargeting = true;
        window.scrollIndex = index;
        logEvent(t('msg_scroll_dmg_log_start'), "log-sys");
    }
}

// Закрытие контекстного меню по клику в любом месте
document.addEventListener('click', () => {
    let menu = document.getElementById('inv-context-menu');
    if (menu) menu.style.display = 'none';
    let tooltip = document.getElementById('inv-item-tooltip');
    if (tooltip) tooltip.style.display = 'none';
});

document.addEventListener('contextmenu', (e) => {
    e.preventDefault();
});

// --- КАСТОМНАЯ СИСТЕМА ДРАГ-ЭНД-ДРОПА С ПОВОРОТОМ (КАК В ТАРКОВЕ) ---
window.draggedItem = null;
window.draggedItemIndex = null;
window.draggedItemOrig = null;
window.draggedElement = null;
window.dragGrabOffset = { x: 0, y: 0 };
window.draggedCurrentX = 0;
window.draggedCurrentY = 0;
window.draggedTargetX = 0;
window.draggedTargetY = 0;
window.isSnapping = false;

window.dragStartPointer = { x: 0, y: 0 };
window.dragStartItemIndex = null;
window.dragPending = false;

function initDragOrClick(index, pointerEvent) {
    if (window.draggedItem || window.isSnapping) return;
    
    window.dragPending = true;
    window.dragStartItemIndex = index;
    window.dragStartPointer = { x: pointerEvent.clientX, y: pointerEvent.clientY };
}

function startDragging(index, pointerEvent) {
    if (window.draggedItem || window.isSnapping) return;
    
    // Закрываем открытые контекстные меню и тултипы
    let menu = document.getElementById('inv-context-menu');
    if (menu) menu.style.display = 'none';
    let tooltip = document.getElementById('inv-item-tooltip');
    if (tooltip) tooltip.style.display = 'none';

    let item = items[index];
    window.draggedItem = item;
    window.draggedItemIndex = index;
    window.draggedItemOrig = {
        x: item.x,
        y: item.y,
        container: item.container,
        w: item.w,
        h: item.h,
        isRotated: item.isRotated || false
    };

    // Создаем плавающий элемент, следующий за мышью
    let el = document.createElement('div');
    el.className = `inv-item rarity-${item.rarity}`;
    el.style.width = `${item.w * TILE_SIZE}px`;
    el.style.height = `${item.h * TILE_SIZE}px`;
    el.style.position = 'fixed';
    el.style.pointerEvents = 'none';
    el.style.zIndex = '9999';
    el.style.opacity = '0.85';
    el.style.boxShadow = '0 6px 12px rgba(0,0,0,0.6)';
    el.style.border = '2px solid #ffcc00';

    if (images[item.img] && images[item.img].complete) {
        let img = document.createElement('img');
        img.src = images[item.img].src;
        if (item.isRotated) {
            img.style.position = 'absolute';
            img.style.left = '50%';
            img.style.top = '50%';
            img.style.width = `${item.h * TILE_SIZE}px`;
            img.style.height = `${item.w * TILE_SIZE}px`;
            img.style.transform = 'translate(-50%, -50%) rotate(90deg)';
        } else {
            img.style.width = '100%';
            img.style.height = '100%';
        }
        el.appendChild(img);
    } else {
        el.style.fontSize = '9px';
        el.innerText = getItemName(item).substring(0, 4);
    }
    
    document.body.appendChild(el);
    window.draggedElement = el;

    // Скрываем оригинальный элемент
    let origEl = GRIDS[item.container].el.querySelector(`[data-index="${index}"]`);
    if (origEl) {
        origEl.style.opacity = '0';
    }

    // Вычисляем начальные экранные координаты ячейки в зум-пикселях для плавного старта
    let origGridDef = GRIDS[item.container];
    let origRect = origGridDef.el.getBoundingClientRect();
    let currentZoom = parseFloat(getComputedStyle(document.body).zoom) || 1.0;
    
    let gridLeft = origRect.left / currentZoom;
    let gridTop = origRect.top / currentZoom;
    
    let startLeft = gridLeft + item.x * TILE_SIZE;
    let startTop = gridTop + item.y * TILE_SIZE;

    // Устанавливаем текущую позицию плавающего элемента в стартовую координату ячейки
    window.draggedCurrentX = startLeft;
    window.draggedCurrentY = startTop;
    
    el.style.left = `${startLeft}px`;
    el.style.top = `${startTop}px`;

    // Рассчитываем смещение захвата курсора внутри элемента
    let itemRect = origEl ? origEl.getBoundingClientRect() : { left: pointerEvent.clientX, top: pointerEvent.clientY };
    window.dragGrabOffset = {
        x: (pointerEvent.clientX - itemRect.left) / currentZoom,
        y: (pointerEvent.clientY - itemRect.top) / currentZoom
    };

    // Обновляем цель на координаты мыши
    window.draggedTargetX = pointerEvent.clientX / currentZoom - window.dragGrabOffset.x;
    window.draggedTargetY = pointerEvent.clientY / currentZoom - window.dragGrabOffset.y;

    window.isSnapping = false;
    
    // Запускаем LERP-анимацию
    requestAnimationFrame(updateDragLoop);
    
    playSound('inventory');
}

function updateDragLoop() {
    if (!window.draggedItem || !window.draggedElement || window.isSnapping) return;
    
    let dx = window.draggedTargetX - window.draggedCurrentX;
    let dy = window.draggedTargetY - window.draggedCurrentY;
    
    // Коэффициент интерполяции (0.25 дает идеальный баланс отзывчивости и мягкости)
    window.draggedCurrentX += dx * 0.25;
    window.draggedCurrentY += dy * 0.25;
    
    window.draggedElement.style.left = `${window.draggedCurrentX}px`;
    window.draggedElement.style.top = `${window.draggedCurrentY}px`;
    
    requestAnimationFrame(updateDragLoop);
}

function updateDraggedPosition(clientX, clientY) {
    if (!window.draggedElement || window.isSnapping) return;
    let currentZoom = parseFloat(getComputedStyle(document.body).zoom) || 1.0;
    window.draggedTargetX = clientX / currentZoom - window.dragGrabOffset.x;
    window.draggedTargetY = clientY / currentZoom - window.dragGrabOffset.y;
}

function rotateDraggedItem() {
    if (!window.draggedItem || window.isSnapping) return;
    let item = window.draggedItem;
    
    // Запрещаем вращать квадратные предметы (1x1, 2x2 и т.д.)
    if (item.w === item.h) return;
    
    let oldW = item.w * TILE_SIZE;
    let oldH = item.h * TILE_SIZE;
    
    // Вычисляем относительные координаты клика на предмете (от 0 до 1)
    let pctX = window.dragGrabOffset.x / oldW;
    let pctY = window.dragGrabOffset.y / oldH;
    
    // Поворачиваем размеры предмета
    let temp = item.w;
    item.w = item.h;
    item.h = temp;
    
    let newW = item.w * TILE_SIZE;
    let newH = item.h * TILE_SIZE;
    
    // Рассчитываем новые смещения мыши так, чтобы курсор оставался на той же точке текстуры при повороте на 90 градусов по часовой стрелке:
    // newPctX = 1 - pctY
    // newPctY = pctX
    let newPctX = 1 - pctY;
    let newPctY = pctX;
    
    let newGrabOffsetX = newPctX * newW;
    let newGrabOffsetY = newPctY * newH;
    
    // Разница смещений, чтобы скорректировать координаты плавающего элемента и предотвратить отскок
    let diffX = window.dragGrabOffset.x - newGrabOffsetX;
    let diffY = window.dragGrabOffset.y - newGrabOffsetY;
    
    window.dragGrabOffset.x = newGrabOffsetX;
    window.dragGrabOffset.y = newGrabOffsetY;
    
    // Корректируем текущую позицию и цель, чтобы предмет мгновенно развернулся ровно вокруг курсора
    window.draggedCurrentX += diffX;
    window.draggedCurrentY += diffY;
    window.draggedTargetX += diffX;
    window.draggedTargetY += diffY;
    
    // Обновляем плавающий DOM-элемент
    if (window.draggedElement) {
        window.draggedElement.style.width = `${item.w * TILE_SIZE}px`;
        window.draggedElement.style.height = `${item.h * TILE_SIZE}px`;
        
        // Обновляем текущее положение DOM-элемента до следующего кадра LERP, чтобы не было микро-вспышки
        window.draggedElement.style.left = `${window.draggedCurrentX}px`;
        window.draggedElement.style.top = `${window.draggedCurrentY}px`;
        
        let img = window.draggedElement.querySelector('img');
        if (img) {
            let isRot = (item.w !== window.draggedItemOrig.w || item.h !== window.draggedItemOrig.h) ? !window.draggedItemOrig.isRotated : window.draggedItemOrig.isRotated;
            if (isRot) {
                img.style.position = 'absolute';
                img.style.left = '50%';
                img.style.top = '50%';
                img.style.width = `${item.h * TILE_SIZE}px`;
                img.style.height = `${item.w * TILE_SIZE}px`;
                img.style.transform = 'translate(-50%, -50%) rotate(90deg)';
            } else {
                img.style.position = '';
                img.style.left = '';
                img.style.top = '';
                img.style.width = '100%';
                img.style.height = '100%';
                img.style.transform = '';
            }
        }
    }
    
    playSound('inventory');
}

function dropDraggedItem(clientX, clientY) {
    if (window.isSnapping) return;
    
    let item = window.draggedItem;
    let currentZoom = parseFloat(getComputedStyle(document.body).zoom) || 1.0;
    
    let targetContainer = null;
    let targetX = -1;
    let targetY = -1;
    
    for (let cName in GRIDS) {
        if (cName.startsWith('equip_')) continue;
        
        let gridDef = GRIDS[cName];
        let rect = gridDef.el.getBoundingClientRect();
        
        if (clientX >= rect.left && clientX <= rect.right &&
            clientY >= rect.top && clientY <= rect.bottom) {
            
            let itemLeft = (clientX - rect.left) / currentZoom - window.dragGrabOffset.x;
            let itemTop = (clientY - rect.top) / currentZoom - window.dragGrabOffset.y;
            
            targetX = Math.round(itemLeft / TILE_SIZE);
            targetY = Math.round(itemTop / TILE_SIZE);
            targetContainer = cName;
            break;
        }
    }
    
    let success = false;
    
    if (targetContainer) {
        let gridDef = GRIDS[targetContainer];
        let isRestricted = gridDef.restrict && item.type !== gridDef.restrict;
        
        if (!isRestricted && 
            targetX >= 0 && targetX + item.w <= gridDef.w && 
            targetY >= 0 && targetY + item.h <= gridDef.h) {
            
            let collision = false;
            items.filter(it => it.container === targetContainer && it !== item).forEach(it => {
                let intersectX = Math.max(targetX, it.x) < Math.min(targetX + item.w, it.x + it.w);
                let intersectY = Math.max(targetY, it.y) < Math.min(targetY + item.h, it.y + it.h);
                if (intersectX && intersectY) collision = true;
            });
            
            if (!collision) {
                success = true;
            }
        }
    }
    
    // НАЧАЛО СМУЗ-СНЕП АНИМАЦИИ
    window.isSnapping = true;
    
    let destLeft = 0;
    let destTop = 0;
    
    if (success) {
        let gridDef = GRIDS[targetContainer];
        let rect = gridDef.el.getBoundingClientRect();
        destLeft = rect.left / currentZoom + targetX * TILE_SIZE;
        destTop = rect.top / currentZoom + targetY * TILE_SIZE;
    } else {
        // Слайд назад к исходной позиции
        let origGridDef = GRIDS[window.draggedItemOrig.container];
        let rect = origGridDef.el.getBoundingClientRect();
        destLeft = rect.left / currentZoom + window.draggedItemOrig.x * TILE_SIZE;
        destTop = rect.top / currentZoom + window.draggedItemOrig.y * TILE_SIZE;
    }
    
    if (window.draggedElement) {
        // Применяем CSS переход для идеальной плавности
        window.draggedElement.style.transition = 'left 0.15s cubic-bezier(0.25, 0.8, 0.25, 1), top 0.15s cubic-bezier(0.25, 0.8, 0.25, 1)';
        window.draggedElement.style.border = '2px solid #555'; // Убираем желтую рамку
        window.draggedElement.style.left = `${destLeft}px`;
        window.draggedElement.style.top = `${destTop}px`;
    }
    
    setTimeout(() => {
        if (success) {
            item.x = targetX;
            item.y = targetY;
            item.container = targetContainer;
            item.isRotated = (item.w !== window.draggedItemOrig.w || item.h !== window.draggedItemOrig.h) ? !window.draggedItemOrig.isRotated : window.draggedItemOrig.isRotated;
            playSound('inventory');
        } else {
            item.x = window.draggedItemOrig.x;
            item.y = window.draggedItemOrig.y;
            item.container = window.draggedItemOrig.container;
            item.w = window.draggedItemOrig.w;
            item.h = window.draggedItemOrig.h;
            item.isRotated = window.draggedItemOrig.isRotated;
        }
        
        cleanupDragging();
        renderInventory();
        window.isSnapping = false;
    }, 150);
}

function cancelDragging() {
    if (!window.draggedItem || window.isSnapping) return;
    dropDraggedItem(-1000, -1000); // Принудительно вызываем фейл для плавного возврата
}

function cleanupDragging() {
    window.draggedItem = null;
    window.draggedItemIndex = null;
    window.draggedItemOrig = null;
    if (window.draggedElement) {
        window.draggedElement.remove();
        window.draggedElement = null;
    }
}

// Глобальные слушатели событий мыши и клавиатуры для перетаскивания
document.addEventListener('mousemove', e => {
    if (window.dragPending) {
        let dx = e.clientX - window.dragStartPointer.x;
        let dy = e.clientY - window.dragStartPointer.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            window.dragPending = false;
            startDragging(window.dragStartItemIndex, e);
        }
    } else if (window.draggedItem) {
        updateDraggedPosition(e.clientX, e.clientY);
    }
});

document.addEventListener('touchmove', e => {
    if (window.dragPending) {
        let touch = e.touches[0];
        let dx = touch.clientX - window.dragStartPointer.x;
        let dy = touch.clientY - window.dragStartPointer.y;
        let dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > 5) {
            window.dragPending = false;
            startDragging(window.dragStartItemIndex, touch);
        }
    } else if (window.draggedItem) {
        let touch = e.touches[0];
        updateDraggedPosition(touch.clientX, touch.clientY);
    }
}, { passive: false });

document.addEventListener('mouseup', e => {
    if (window.dragPending) {
        // Это был обычный клик (мышка не двигалась) -> открываем контекстное меню
        let index = window.dragStartItemIndex;
        window.dragPending = false;
        showContextMenu(e, index);
    } else if (window.draggedItem) {
        if (e.button === 0) {
            dropDraggedItem(e.clientX, e.clientY);
        }
    }
});

document.addEventListener('touchend', e => {
    if (window.dragPending) {
        // Это был обычный тап на мобилке (без свайпа) -> открываем контекстное меню
        let index = window.dragStartItemIndex;
        window.dragPending = false;
        let fakeEvent = { clientX: window.dragStartPointer.x, clientY: window.dragStartPointer.y, preventDefault: () => {}, stopPropagation: () => {} };
        showContextMenu(fakeEvent, index);
    } else if (window.draggedItem) {
        let touch = e.changedTouches[0];
        dropDraggedItem(touch.clientX, touch.clientY);
    }
});

document.addEventListener('mousedown', e => {
    if (window.draggedItem && e.button === 2) {
        e.preventDefault();
        e.stopPropagation();
        rotateDraggedItem();
    }
});

document.addEventListener('keydown', e => {
    if (window.draggedItem) {
        if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'к') {
            e.preventDefault();
            rotateDraggedItem();
        } else if (e.key === 'Escape') {
            e.preventDefault();
            cancelDragging();
        }
    }
});