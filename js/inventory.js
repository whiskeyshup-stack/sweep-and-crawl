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
            let img = document.createElement('img'); img.src = images[item.img].src; el.appendChild(img);
        } else {
            el.style.fontSize = '9px'; el.innerText = getItemName(item).substring(0, 4);
        }

        // Открытие контекстного меню при левом или правом клике
        el.addEventListener('click', e => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e, index);
        });
        el.addEventListener('contextmenu', e => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e, index);
        });
        // Поддержка тапа на мобильных для открытия контекстного меню
        el.addEventListener('touchend', e => {
            e.preventDefault();
            e.stopPropagation();
            // Создаём фейковый объект с координатами касания
            let touch = e.changedTouches[0];
            let fakeEvent = { clientX: touch.clientX, clientY: touch.clientY, preventDefault: () => {}, stopPropagation: () => {} };
            showContextMenu(fakeEvent, index);
        }, { passive: false });

        // DRAG AND DROP
        // НОВОЕ: Запрещаем таскать вещи, если они надеты
        el.draggable = !item.container.startsWith('equip_');

        el.addEventListener('dragstart', e => {
            e.dataTransfer.setData('text/plain', index);
            setTimeout(() => el.style.visibility = 'hidden', 0);
        });
        el.addEventListener('dragend', () => el.style.visibility = 'visible');

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
            actionBtn.innerText = t('inv_ctx_unequip');
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
            actionBtn.innerText = t('inv_ctx_equip');
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
                item.x = 0;
                item.y = 0;
                item.container = slotName;
                logEvent(t('inv_ctx_equip_log', { name: getItemName(item) }));
                playSound('equip');
                renderInventory();
            };
        }
    } else {
        actionBtn.innerText = t('inv_ctx_use');
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
        sellBtn.innerText = t('inv_ctx_sell', { val: val });
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
        destroyBtn.innerText = t('inv_ctx_destroy_btn');
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
        let healPercent = 0.10 + Math.random() * 0.05;
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
        player.invulnCharges = 5;
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

// Навешиваем слушатели на все контейнеры инвентаря
Object.keys(GRIDS).forEach(cName => {
    let el = GRIDS[cName].el;
    el.addEventListener('dragover', e => e.preventDefault());
    el.addEventListener('drop', e => {
        e.preventDefault();

        // НОВОЕ: Запрет перетаскивания В слоты экипировки
        if (cName.startsWith('equip_')) {
            logEvent(t('msg_cant_drag_equip'), "log-error");
            return;
        }

        let index = parseInt(e.dataTransfer.getData('text/plain'));
        let item = items[index];
        let currentZoom = parseFloat(getComputedStyle(document.body).zoom) || 1.0;
        let rect = el.getBoundingClientRect();
        let targetX = Math.floor(((e.clientX - rect.left) / currentZoom) / TILE_SIZE);
        let targetY = Math.floor(((e.clientY - rect.top) / currentZoom) / TILE_SIZE);

        if (GRIDS[cName].restrict && item.type !== GRIDS[cName].restrict) return renderInventory();

        if (targetX >= 0 && targetX + item.w <= GRIDS[cName].w && targetY >= 0 && targetY + item.h <= GRIDS[cName].h) {
            let collision = false;
            items.filter(it => it.container === cName && it !== item).forEach(it => {
                let intersectX = Math.max(targetX, it.x) < Math.min(targetX + item.w, it.x + it.w);
                let intersectY = Math.max(targetY, it.y) < Math.min(targetY + item.h, it.y + it.h);
                if (intersectX && intersectY) collision = true;
            });

            if (!collision) {
                item.x = targetX; item.y = targetY; item.container = cName;
                playSound('inventory');
            }
        }
        renderInventory();
    });
});