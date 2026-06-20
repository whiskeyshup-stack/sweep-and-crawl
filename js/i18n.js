window.currentLanguage = 'ru';

const i18n = {
    ru: {
        welcome_title: "SWEEP & CRAWL",
        welcome_intro: "Приветствую тебя, путник! Наше королевство было заминировано злым колдуном и усеяно его злобными прихвостнями. Тебе предстоит отправиться в путь и освободить наши земли от гнуса и скверны.<br><br>Как только ты одолеешь всех врагов и откроешь безопасные участки земли, твоя миссия будет завершена.<br><br>Как сапёр высшего класса, ты практически бессмертен. Но будь осторожен: при потере сознания ты потеряешь всё содержимое своих карманов! Собирай осколки душ, что остаются от миньонов колдуна — они помогут тебе стать сильнее.<br><br>Удачи, солдат!",
        controls_title: "УПРАВЛЕНИЕ",
        controls_lmb: "• ЛКМ — Открыть клетку / Атаковать врага",
        controls_rmb: "• ПКМ — Поставить флаг (пометить мину)",
        controls_movement: "• WASD / Стрелочки — Перемещение камеры",
        controls_threat: "• <img src=\"Ui/Def.png\" class=\"ui-icon\"> Цифры показывают количество мин вокруг!",
        btn_play: "ИГРАТЬ",
        
        settings_title: "НАСТРОЙКИ",
        volume_master: "ОБЩИЙ ЗВУК",
        volume_music: "МУЗЫКА",
        volume_sfx: "ЭФФЕКТЫ",
        btn_reset_save: "СБРОСИТЬ СЕЙВ",
        
        stash_title: "ХРАНИЛИЩЕ",
        hero_title: "ГЕРОЙ",
        stat_gold: "<img src=\"Ui/Coin.png\" class=\"ui-icon\"> ЗОЛОТО:",
        stat_shards: "<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> ДУШИ:",
        stat_wins: "<img src=\"Ui/Win.png\" class=\"ui-icon\"> ПОБЕДЫ:",
        stat_threat: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> УГРОЗА:",
        btn_buy_shards: "Купить 5<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> за 100<img src=\"Ui/Coin.png\" class=\"ui-icon\">",
        slot_sword: "МЕЧ",
        slot_armor: "БРОНЯ",
        upgrades_title: "<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> УЛУЧШЕНИЯ",
        upgrade_atk: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> УРОН:",
        upgrade_hp: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> ХП:",
        upgrade_arm: "<img src=\"Ui/Def.png\" class=\"ui-icon\"> ДЕФ:",
        btn_raid: "В РЕЙД",
        
        gui_hp: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> ХП:",
        gui_atk: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> УРОН:",
        gui_arm: "<img src=\"Ui/Def.png\" class=\"ui-icon\"> ЗАЩИТА:",
        gui_pockets: "КАРМАНЫ",
        
        modal_title_attention: "ВНИМАНИЕ",
        modal_title_victory: "<img src=\"Ui/Win.png\" class=\"ui-icon\"> ПОБЕДА",
        modal_title_defeat: "Поражение",
        modal_title_evac: "Эвакуация",
        modal_title_tp: "<img src=\"Teleport.png\" class=\"ui-icon\"> СВИТОК ТЕЛЕПОРТАЦИИ",
        modal_ok: "ОК",
        modal_cancel: "ОТМЕНА",
        
        msg_not_enough_gold: "! Недостаточно золота для покупки душ!",
        msg_gold_purchased: "<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> Куплено 5 осколков душ!",
        msg_not_enough_shards: "! Недостаточно душ для улучшения!",
        msg_stat_upgraded: "Характеристика улучшена!",
        msg_item_in_pockets: "Предмет должен находиться в карманах во время рейда!",
        msg_tp_confirm: "Вы хотите активировать свиток и вернуться в Лагерь?\n\nВсё содержимое карманов перенесётся в безопасный схрон.",
        msg_tp_success: "Вы успешно эвакуировались! Всё содержимое карманов перемещено в хранилище.",
        msg_tp_cancel: "Использование свитка телепортации отменено.",
        msg_food_use: "Использовано: восстановил {heal} <img src=\"Ui/Heart.png\" class=\"ui-icon\">.",
        msg_inv_full: "В карманах нет места!",
        msg_cant_equip: "Нельзя экипировать этот предмет!",
        msg_cant_unequip: "Сначала освободите место в хранилище!",
        msg_victory_text: "<img src=\"Ui/Win.png\" class=\"ui-icon\"> Поздравляем, солдат! Главная угроза позади: королевство очищено от скверны, а коварные мины колдуна больше не угрожают мирным жителям. Ты спас эти земли!\n\nОднако злые силы не дремлют, и в дальних уголках мира всё ещё находят следы магии колдуна. Твои карманы полны припасов, а осколки душ сделали тебя сильным как никогда.\n\nГотов ли ты к новым, ещё более опасным вылазкам, сапёр?",
        msg_defeat_text: "Вы потеряли сознание!\n\nВсе содержимое карманов и 80% добытых в рейде золота/осколков потеряны.\nВозвращение в Лагерь.",
        msg_reset_confirm_1: "! ВНИМАНИЕ! Вы уверены, что хотите ПОЛНОСТЬЮ СБРОСИТЬ весь игровой прогресс, золото, улучшения и схрон?",
        msg_reset_confirm_2: "Окончательное подтверждение удаления. Это действие нельзя отменить!",
        msg_reset_done: "Сохранение успешно удалено. Игра перезагружается...",
        msg_died_log: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> ВЫ ПОТЕРЯЛИ СОЗНАНИЕ. Карманный лут и 80% добытых ресурсов потеряны.",
        msg_raid_start_log: "--- НОВЫЙ РЕЙД НАЧАТ (УГРОЗА: LVL {lvl}) ---",
        
        stats_header: "СТАТИСТИКА ВЫЛАЗКИ:",
        stats_clearance: "• Зачищено карты:",
        stats_time: "• Время в рейде:",
        stats_killed: "• Убито врагов:",
        stats_chests: "• Открыто сундуков:",
        stats_mines: "• Взорвано мин:",
        stats_gold: "• Золота найдено:",
        stats_shards: "• Получено осколков:",
        
        enemy_orc: "Орк",
        enemy_soldier: "Солдат",
        threat_detected: "! Обнаружен {enemy} Lvl {lvl}! Зона вокруг него заблокирована.",
        enemy_killed_scroll: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> Враг убит магией! Зона освобождена.",
        enemy_killed_combat: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> Враг убит! Зона освобождена.",
        chest_dropped: "Из поверженного врага выпал сундук Lvl {lvl}!",
        scroll_ether_fail: "<img src=\"Invis.png\" class=\"ui-icon\"> Вы наступили на мину, но Свиток Эфира поглотил урон! Зарядов не осталось. Защита спала.",
        scroll_ether_fail_chord: "<img src=\"Invis.png\" class=\"ui-icon\"> Аккорд активировал мину, но Свиток Эфира защитил вас! Зарядов не осталось. Защита спала.",
        scroll_ether_use: "<img src=\"Invis.png\" class=\"ui-icon\"> Вы наступили на мину, но Свиток Эфира поглотил урон! (Осталось зарядов: {charges})",
        scroll_ether_use_chord: "<img src=\"Invis.png\" class=\"ui-icon\"> Аккорд активировал мину, но Свиток Эфира защитил вас! (Осталось зарядов: {charges})",
        mine_direct_hit: "ВЫ НАСТУПИЛИ НА МИНУ! Получено {dmg} урона!",
        mine_chord_hit: "Аккорд активировал скрытую мину! Получено {dmg} урона!",
        
        inv_destroy_title: "РАЗРУШЕНИЕ ПРЕДМЕТА",
        inv_destroy_msg: "Вы действительно хотите навсегда РАЗРУШИТЬ этот предмет?",
        inv_ctx_use: "Использовать",
        inv_ctx_equip: "Экипировать",
        inv_ctx_unequip: "Снять в stash",
        inv_ctx_move_pockets: "Положить в pockets",
        inv_ctx_move_stash: "Положить в stash",
        inv_ctx_destroy: "Разрушить",
        
        msg_scroll_dmg_log: "<img src=\"Damage.png\" class=\"ui-icon\"> Свиток Урона бросил {rolls} + 50 и нанёс {dmg} урона врагу! (Осталось: {left})",
        msg_scroll_dmg_cancel: "Использование свитка отменено (необходимо целиться в открытого врага).",
        msg_sword_combat_log: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> Удар: вы бросили {notation} ({rolls}) + {mod} = нанесли {dmg} урона врагу! (Осталось: {left})",
        msg_enemy_attack_log: "Враг бросил {rolls} + {mod} = нанёс {dmg} урона вам (поглощено {arm} броней).",
        
        item_weapon: "Оружие",
        item_armor: "Броня",
        item_scroll_tp: "Свиток телепортации",
        item_scroll_dmg: "Свиток урона",
        item_scroll_ether: "Свиток эфира (Защита)",
        item_food: "Сухпаек (+25-35% ХП)",
        item_potion: "Зелье здоровья",
        item_unknown: "Неизвестный предмет",
        
        item_rarity_common: "Обычный",
        item_rarity_uncommon: "Необычный",
        item_rarity_rare: "Редкий",
        item_rarity_epic: "Эпический",
        item_rarity_legendary: "Легендарный",
        
        stat_atk_bonus: "Урон",
        stat_arm_bonus: "Защита",
        
        item_rarity_label: "Редкость",
        item_type_label: "Тип",
        
        item_label: "{rarity} предмет",
        item_weapon_val: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> Сила атаки: <span style=\"font-weight:bold;\">+{val} урона</span>",
        item_quality_lvl: "Качество: {quality} | Уровень: {lvl}",
        item_weapon_desc: "Увеличивает урон персонажа в бою. Экипируется в слот оружия.",
        item_armor_val: "<img src=\"Ui/Def.png\" class=\"ui-icon\"> Защита брони: <span style=\"font-weight:bold;\">+{val} защиты</span>",
        item_armor_desc: "Поглощает урон от ответных атак монстров. Экипируется в слот брони.",
        item_food_val: "Эффект: <span style=\"font-weight:bold;\">+25-35% <img src=\"Ui/Heart.png\" class=\"ui-icon\"></span>",
        item_food_desc: "Вкусный жареный окорочок. Восстанавливает 25-35% максимального здоровья при съедении.",
        item_potion_small_val: "Эффект: <span style=\"font-weight:bold;\">+50% <img src=\"Ui/Heart.png\" class=\"ui-icon\"></span>",
        item_potion_small_desc: "Малое зелье лечения. Восстанавливает 50% максимального здоровья при использовании.",
        item_potion_big_val: "Эффект: <span style=\"font-weight:bold;\">+100% <img src=\"Ui/Heart.png\" class=\"ui-icon\"></span>",
        item_potion_big_desc: "Большое зелье лечения. Полностью восстанавливает здоровье героя.",
        item_scroll_dmg_val: "<img src=\"Damage.png\" class=\"ui-icon\"> Свиток Молнии",
        item_scroll_dmg_desc: "При активации наносит огромный урон (50 + Lvl*10) выбранному открытому врагу издалека.",
        item_scroll_invis_val: "<img src=\"Invis.png\" class=\"ui-icon\"> Свиток Эфира",
        item_scroll_invis_desc: "Дарует защиту на 3 следующих контакта с врагами или взрывов бомб.",
        item_scroll_tp_val: "<img src=\"Teleport.png\" class=\"ui-icon\"> Свиток Телепортации",
        item_scroll_tp_desc: "Позволяет безопасно эвакуироваться из рейда в Лагерь. При активации весь накопленный в карманах лут переносится в хранилище.",
        
        inv_ctx_unequip: "Снять",
        inv_ctx_unequip_log: "Снято: [{name}] перемещен в {dest}.",
        inv_ctx_stash_dest: "схрон",
        inv_ctx_pockets_dest: "карманы",
        inv_ctx_no_space: "Нет свободного места для снятия предмета!",
        inv_ctx_equip: "Надеть",
        inv_ctx_equip_log: "Надето: [{name}]!",
        inv_ctx_use: "Использовать",
        inv_ctx_sell: "Продать за {val}<img src=\"Ui/Coin.png\" class=\"ui-icon\">",
        inv_ctx_sell_log: "<img src=\"Ui/Coin.png\" class=\"ui-icon\"> Продано: [{name}] за {val} Золота.",
        inv_ctx_destroy_btn: "Уничтожить",
        inv_ctx_destroy_confirm: "Вы уверены, что хотите уничтожить [{name}]?",
        inv_ctx_destroy_title: "Уничтожение предмета",
        inv_ctx_destroy_log: "Уничтожено: [{name}].",
        
        msg_cant_use_hub: "Использовать зелья и свитки можно только в Рейде!",
        msg_cant_use_stash: "Предмет должен находиться в карманах во время рейда!",
        msg_food_log: "Скушали окорочок: восполнено {heal} <img src=\"Ui/Heart.png\" class=\"ui-icon\"> HP.",
        msg_potion_small_log: "Малое зелье здоровья: восполнено {heal} <img src=\"Ui/Heart.png\" class=\"ui-icon\"> HP.",
        msg_potion_big_log: "Большое зелье здоровья: здоровье полностью восстановлено!",
        msg_scroll_invis_log: "<img src=\"Invis.png\" class=\"ui-icon\"> Свиток Эфира: вы неуязвимы на следующие 3 контакта с врагами или взрывов бомб!",
        msg_scroll_dmg_log_start: "<img src=\"Damage.png\" class=\"ui-icon\"> Свиток Урона: Кликните по открытому врагу на поле боя!",
        msg_cant_drag_equip: "Надевайте вещи только через контекстное меню (Клик -> Надеть)!",
        
        scroll_ether_fail_combat: "<img src=\"Invis.png\" class=\"ui-icon\"> Враг бьёт вас, но Свиток Эфира полностью поглотил урон! Зарядов не осталось. Защита спала.",
        scroll_ether_use_combat: "<img src=\"Invis.png\" class=\"ui-icon\"> Враг бьёт вас, но Свиток Эфира полностью поглотил урон! (Осталось зарядов: {charges})",
        msg_zone_controlled: "Эта зона контролируется врагом! Убейте его, чтобы взаимодействовать.",
        debug_godmode_on: "ДЕБАГ: Режим Бога ВКЛЮЧЕН!",
        debug_godmode_off: "ДЕБАГ: Режим Бога ВЫКЛЮЧЕН.",
        
        name_royal_sword: "Королевский Меч",
        name_hardened_sword: "Закаленный Меч",
        name_simple_sword: "Простой Меч",
        name_royal_armor: "Королевские латы",
        name_knight_armor: "Латы рыцаря",
        name_leather_armor: "Кожаный доспех",
        name_food: "Окорочок",
        name_potion_small: "Малое зелье ХП",
        name_potion_big: "Большое зелье ХП",
        name_scroll_dmg: "Свиток Урона",
        name_scroll_invis: "Свиток Неуязвимости",
        name_scroll_tp: "Свиток Телепорта",
        
        msg_found_item: "Найдено: [{name}] и +{gold} <img src=\"Ui/Coin.png\" class=\"ui-icon\">!",
        msg_chest_full: "В сундуке был [{name}], но карманы полны!",

        btn_return_camp: "В ЛАГЕРЬ",
        msg_return_camp_confirm: "Вернуться в Лагерь?\n\nВесь лут из карманов сохранится в хранилище.\nОбласть ещё не зачищена полностью.",
        msg_return_camp_confirm_clear: "Область зачищена! Вернуться в Лагерь с победой?\n\nВесь лут из карманов перейдёт в хранилище.",
        msg_area_cleared: "ОБЛАСТЬ ЗАЧИЩЕНА",
        msg_objective_reached_log: "Цель выполнена: все враги уничтожены и 75% территории зачищено!",
        msg_extraction_available: "Эвакуация доступна! Вы можете вернуться в лагерь.",
        modal_title_return: "ВОЗВРАТ В ЛАГЕРЬ",
        msg_enemy_drop_food: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> Враг бросил окорочок!",
        msg_enemy_drop_potion: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> Враг бросил малое зелье!",
        hub_pockets_title: "В РЕЙД (КАРМАНЫ)"
    },
    en: {
        welcome_title: "SWEEP & CRAWL",
        welcome_intro: "Greetings, traveler! Our kingdom has been mined by an evil wizard and infested with his wicked henchmen. You must set out and rid our lands of this filth and corruption.<br><br>Once you defeat all enemies and clear all safe areas, your mission will be complete.<br><br>As a top-class sweeper, you are practically immortal. But beware: if you lose consciousness, you will lose all the contents of your pockets! Collect soul shards dropped by the wizard's minions — they will help you grow stronger.<br><br>Good luck, soldier!",
        controls_title: "CONTROLS",
        controls_lmb: "• LMB — Open cell / Attack enemy",
        controls_rmb: "• RMB — Place flag (mark mine)",
        controls_movement: "• WASD / Arrow keys — Move camera",
        controls_threat: "• <img src=\"Ui/Def.png\" class=\"ui-icon\"> Numbers show the amount of mines around!",
        btn_play: "PLAY",
        
        settings_title: "SETTINGS",
        volume_master: "MASTER VOLUME",
        volume_music: "MUSIC",
        volume_sfx: "SFX",
        btn_reset_save: "RESET SAVE",
        
        stash_title: "STASH",
        hero_title: "HERO",
        stat_gold: "<img src=\"Ui/Coin.png\" class=\"ui-icon\"> GOLD:",
        stat_shards: "<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> SHARDS:",
        stat_wins: "<img src=\"Ui/Win.png\" class=\"ui-icon\"> WINS:",
        stat_threat: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> THREAT:",
        btn_buy_shards: "Buy 5<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> for 100<img src=\"Ui/Coin.png\" class=\"ui-icon\">",
        slot_sword: "SWORD",
        slot_armor: "ARMOR",
        upgrades_title: "<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> UPGRADES",
        upgrade_atk: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> ATK:",
        upgrade_hp: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> HP:",
        upgrade_arm: "<img src=\"Ui/Def.png\" class=\"ui-icon\"> ARM:",
        btn_raid: "TO RAID",
        
        gui_hp: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> HP:",
        gui_atk: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> ATK:",
        gui_arm: "<img src=\"Ui/Def.png\" class=\"ui-icon\"> ARMOR:",
        gui_pockets: "POCKETS",
        
        modal_title_attention: "ATTENTION",
        modal_title_victory: "<img src=\"Ui/Win.png\" class=\"ui-icon\"> VICTORY",
        modal_title_defeat: "Defeat",
        modal_title_evac: "Evacuation",
        modal_title_tp: "<img src=\"Teleport.png\" class=\"ui-icon\"> TELEPORT SCROLL",
        modal_ok: "OK",
        modal_cancel: "CANCEL",
        
        msg_not_enough_gold: "! Not enough gold to buy shards!",
        msg_gold_purchased: "<img src=\"Ui/SoulShard.png\" class=\"ui-icon\"> Purchased 5 soul shards!",
        msg_not_enough_shards: "! Not enough shards for upgrade!",
        msg_stat_upgraded: "Stat upgraded!",
        msg_item_in_pockets: "The item must be in your pockets during a trade!",
        msg_tp_confirm: "Do you want to use the scroll and evacuate to Camp?\n\nAll contents of your pockets will be moved to the safe stash.",
        msg_tp_success: "You evacuated successfully! All contents of your pockets have been moved to the stash.",
        msg_tp_cancel: "Teleportation scroll usage cancelled.",
        msg_food_use: "Used: restored {heal} <img src=\"Ui/Heart.png\" class=\"ui-icon\">.",
        msg_inv_full: "No space in pockets!",
        msg_cant_equip: "Cannot equip this item!",
        msg_cant_unequip: "Free up space in stash first!",
        msg_victory_text: "<img src=\"Ui/Win.png\" class=\"ui-icon\"> Congratulations, soldier! The main threat is behind us: the kingdom is purged of corruption, and the wizard's treacherous mines no longer threaten the peaceful citizens. You have saved these lands!\n\nHowever, the dark forces do not rest, and traces of the wizard's magic are still found in distant corners of the world. Your pockets are pool of supplies, and soul shards have made you stronger than ever.\n\nAre you ready for new, even more dangerous incursions, sweeper?",
        msg_defeat_text: "You lost consciousness!\n\nAll pocket contents and 80% of gold/shards gathered in this raid have been lost.\nReturning to Camp.",
        msg_reset_confirm_1: "! ATTENTION! Are you sure you want to COMPLETELY RESET all game progress, gold, upgrades, and stash?",
        msg_reset_confirm_2: "Final confirmation of deletion. This action cannot be undone!",
        msg_reset_done: "Save successfully deleted. Reloading the game...",
        msg_died_log: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> YOU LOST CONSCIOUSNESS. Pocket loot and 80% of gathered resources have been lost.",
        msg_raid_start_log: "--- NEW RAID STARTED (THREAT: LVL {lvl}) ---",
        
        stats_header: "RAID STATISTICS:",
        stats_clearance: "• Map cleared:",
        stats_time: "• Time in raid:",
        stats_killed: "• Enemies defeated:",
        stats_chests: "• Chests opened:",
        stats_mines: "• Mines exploded:",
        stats_gold: "• Gold found:",
        stats_shards: "• Shards obtained:",
        
        enemy_orc: "Orc",
        enemy_soldier: "Soldier",
        threat_detected: "! Detected {enemy} Lvl {lvl}! The area around them is blocked.",
        enemy_killed_scroll: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> Enemy killed by magic! Area cleared.",
        enemy_killed_combat: "<img src=\"Ui/Dead.png\" class=\"ui-icon\"> Enemy defeated! Area cleared.",
        chest_dropped: "A chest Lvl {lvl} dropped from the defeated enemy!",
        scroll_ether_fail: "<img src=\"Invis.png\" class=\"ui-icon\"> You stepped on a mine, but the Ether Scroll absorbed the damage! No charges left. Protection fell.",
        scroll_ether_fail_chord: "<img src=\"Invis.png\" class=\"ui-icon\"> Chord triggered a mine, but the Ether Scroll protected you! No charges left. Protection fell.",
        scroll_ether_use: "<img src=\"Invis.png\" class=\"ui-icon\"> You stepped on a mine, but the Ether Scroll absorbed the damage! ({charges} charges left)",
        scroll_ether_use_chord: "<img src=\"Invis.png\" class=\"ui-icon\"> Chord triggered a mine, but the Ether Scroll protected you! ({charges} charges left)",
        mine_direct_hit: "YOU STEPPED ON A MINE! Received {dmg} damage!",
        mine_chord_hit: "Chord activated a hidden mine! Received {dmg} damage!",
        
        inv_destroy_title: "ITEM DESTRUCTION",
        inv_destroy_msg: "Are you sure you want to permanently DESTROY this item?",
        inv_ctx_use: "Use",
        inv_ctx_equip: "Equip",
        inv_ctx_unequip: "Unequip to stash",
        inv_ctx_move_pockets: "Move to pockets",
        inv_ctx_move_stash: "Move to stash",
        inv_ctx_destroy: "Destroy",
        
        msg_scroll_dmg_log: "<img src=\"Damage.png\" class=\"ui-icon\"> Damage Scroll rolled {rolls} + 50 and dealt {dmg} damage to enemy! (Remaining: {left})",
        msg_scroll_dmg_cancel: "Scroll usage cancelled (must target a revealed enemy).",
        msg_sword_combat_log: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> Strike: you rolled {notation} ({rolls}) + {mod} = dealt {dmg} damage to enemy! (Remaining: {left})",
        msg_enemy_attack_log: "Enemy rolled {rolls} + {mod} = dealt {dmg} damage to you ({arm} absorbed by armor).",
        
        item_weapon: "Weapon",
        item_armor: "Armor",
        item_scroll_tp: "Scroll of Teleportation",
        item_scroll_dmg: "Scroll of Damage",
        item_scroll_ether: "Scroll of Ether (Shield)",
        item_food: "Dry Rations (+25-35% HP)",
        item_potion: "Health Potion",
        item_unknown: "Unknown Item",
        
        item_rarity_common: "Common",
        item_rarity_uncommon: "Uncommon",
        item_rarity_rare: "Rare",
        item_rarity_epic: "Epic",
        item_rarity_legendary: "Legendary",
        
        stat_atk_bonus: "Damage",
        stat_arm_bonus: "Armor",
        
        item_rarity_label: "Rarity",
        item_type_label: "Type",
        
        item_label: "{rarity} item",
        item_weapon_val: "<img src=\"Ui/Atk.png\" class=\"ui-icon\"> Attack Power: <span style=\"font-weight:bold;\">+{val} damage</span>",
        item_quality_lvl: "Quality: {quality} | Level: {lvl}",
        item_weapon_desc: "Increases character's combat damage. Equips into weapon slot.",
        item_armor_val: "<img src=\"Ui/Def.png\" class=\"ui-icon\"> Armor Protection: <span style=\"font-weight:bold;\">+{val} defense</span>",
        item_armor_desc: "Absorbs damage from monster counter-attacks. Equips into armor slot.",
        item_food_val: "Effect: <span style=\"font-weight:bold;\">+25-35% <img src=\"Ui/Heart.png\" class=\"ui-icon\"></span>",
        item_food_desc: "Tasty roasted drumstick. Restores 25-35% of max HP when eaten.",
        item_potion_small_val: "Effect: <span style=\"font-weight:bold;\">+50% <img src=\"Ui/Heart.png\" class=\"ui-icon\"></span>",
        item_potion_small_desc: "Small healing potion. Restores 50% of maximum health when used.",
        item_potion_big_val: "Effect: <span style=\"font-weight:bold;\">+100% <img src=\"Ui/Heart.png\" class=\"ui-icon\"></span>",
        item_potion_big_desc: "Large healing potion. Fully restores the hero's health.",
        item_scroll_dmg_val: "<img src=\"Damage.png\" class=\"ui-icon\"> Lightning Scroll",
        item_scroll_dmg_desc: "On activation deals huge damage (50 + Lvl*10) to a chosen revealed enemy from afar.",
        item_scroll_invis_val: "<img src=\"Invis.png\" class=\"ui-icon\"> Ether Scroll",
        item_scroll_invis_desc: "Grants protection for the next 3 contacts with enemies or bomb explosions.",
        item_scroll_tp_val: "<img src=\"Teleport.png\" class=\"ui-icon\"> Scroll of Teleportation",
        item_scroll_tp_desc: "Allows safe evacuation from a raid to Camp. On activation all accumulated loot in pockets moves to stash.",
        
        inv_ctx_unequip: "Unequip",
        inv_ctx_unequip_log: "Unequipped: [{name}] moved to {dest}.",
        inv_ctx_stash_dest: "stash",
        inv_ctx_pockets_dest: "pockets",
        inv_ctx_no_space: "No free space to unequip item!",
        inv_ctx_equip: "Equip",
        inv_ctx_equip_log: "Equipped: [{name}]!",
        inv_ctx_use: "Use",
        inv_ctx_sell: "Sell for {val}<img src=\"Ui/Coin.png\" class=\"ui-icon\">",
        inv_ctx_sell_log: "<img src=\"Coin.png\" class=\"ui-icon\"> Sold: [{name}] for {val} Gold.",
        inv_ctx_destroy_btn: "Destroy",
        inv_ctx_destroy_confirm: "Are you sure you want to destroy [{name}]?",
        inv_ctx_destroy_title: "Item Destruction",
        inv_ctx_destroy_log: "Destroyed: [{name}].",
        
        msg_cant_use_hub: "Potions and scrolls can only be used in Raid!",
        msg_cant_use_stash: "The item must be in pockets during a raid!",
        msg_food_log: "Ate a drumstick: restored {heal} <img src=\"Ui/Heart.png\" class=\"ui-icon\"> HP.",
        msg_potion_small_log: "Small health potion: restored {heal} <img src=\"Ui/Heart.png\" class=\"ui-icon\"> HP.",
        msg_potion_big_log: "Large health potion: health fully restored!",
        msg_scroll_invis_log: "<img src=\"Invis.png\" class=\"ui-icon\"> Ether Scroll: you are invulnerable for the next 3 contacts with enemies or bomb explosions!",
        msg_scroll_dmg_log_start: "<img src=\"Damage.png\" class=\"ui-icon\"> Damage Scroll: Click on a revealed enemy on the battlefield!",
        msg_cant_drag_equip: "Equip items only via the context menu (Click -> Equip)!",
        
        scroll_ether_fail_combat: "<img src=\"Invis.png\" class=\"ui-icon\"> Enemy attacks you, but the Ether Scroll absorbed all damage! No charges left. Protection fell.",
        scroll_ether_use_combat: "<img src=\"Invis.png\" class=\"ui-icon\"> Enemy attacks you, but the Ether Scroll absorbed all damage! ({charges} charges left)",
        msg_zone_controlled: "This zone is controlled by the enemy! Defeat them to interact.",
        debug_godmode_on: "DEBUG: Godmode ACTIVATED!",
        debug_godmode_off: "DEBUG: Godmode DEACTIVATED.",
        
        name_royal_sword: "Royal Sword",
        name_hardened_sword: "Hardened Sword",
        name_simple_sword: "Simple Sword",
        name_royal_armor: "Royal Plate",
        name_knight_armor: "Knight's Plate",
        name_leather_armor: "Leather Armor",
        name_food: "Drumstick",
        name_potion_small: "Small HP Potion",
        name_potion_big: "Large HP Potion",
        name_scroll_dmg: "Scroll of Damage",
        name_scroll_invis: "Scroll of Invulnerability",
        name_scroll_tp: "Scroll of Teleport",
        
        msg_found_item: "Found: [{name}] and +{gold} <img src=\"Ui/Coin.png\" class=\"ui-icon\">!",
        msg_chest_full: "The chest contained [{name}], but pockets are full!",

        btn_return_camp: "TO CAMP",
        msg_return_camp_confirm: "Return to Camp?\n\nAll loot in pockets will be saved to stash.\nArea is not fully cleared yet.",
        msg_return_camp_confirm_clear: "Area Cleared! Return to Camp with victory?\n\nAll loot in pockets will move to stash.",
        msg_area_cleared: "AREA CLEARED",
        msg_objective_reached_log: "Objective complete: all enemies defeated and 75% of territory cleared!",
        msg_extraction_available: "Evacuation available! You can return to camp.",
        modal_title_return: "RETURN TO CAMP",
        msg_enemy_drop_food: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> Enemy dropped a drumstick!",
        msg_enemy_drop_potion: "<img src=\"Ui/Heart.png\" class=\"ui-icon\"> Enemy dropped a small potion!",
        hub_pockets_title: "TO RAID (POCKETS)"
    }
};

function t(key, params = {}) {
    let lang = window.currentLanguage || 'ru';
    let text = i18n[lang] && i18n[lang][key] ? i18n[lang][key] : (i18n['ru'][key] || key);
    for (let k in params) {
        text = text.replace('{' + k + '}', params[k]);
    }
    return text;
}

function getItemName(item) {
    if (!item) return "";
    if (!item.nameKey && item.name) {
        let n = item.name.toLowerCase();
        if (n.includes("королевский меч") || n.includes("royal sword")) item.nameKey = 'name_royal_sword';
        else if (n.includes("закаленный меч") || n.includes("hardened sword")) item.nameKey = 'name_hardened_sword';
        else if (n.includes("простой меч") || n.includes("simple sword")) item.nameKey = 'name_simple_sword';
        else if (n.includes("королевские латы") || n.includes("royal plate")) item.nameKey = 'name_royal_armor';
        else if (n.includes("латы рыцаря") || n.includes("knight's plate")) item.nameKey = 'name_knight_armor';
        else if (n.includes("кожаный доспех") || n.includes("leather armor")) item.nameKey = 'name_leather_armor';
        else if (n.includes("окорочок") || n.includes("drumstick")) item.nameKey = 'name_food';
        else if (n.includes("малое зелье хп") || n.includes("small hp potion")) item.nameKey = 'name_potion_small';
        else if (n.includes("большое зелье хп") || n.includes("large hp potion")) item.nameKey = 'name_potion_big';
        else if (n.includes("свиток урона") || n.includes("scroll of damage")) item.nameKey = 'name_scroll_dmg';
        else if (n.includes("свиток неуязвимости") || n.includes("scroll of invulnerability")) item.nameKey = 'name_scroll_invis';
        else if (n.includes("свиток телепорта") || n.includes("scroll of teleport")) item.nameKey = 'name_scroll_tp';
    }
    if (item.nameKey) {
        return t(item.nameKey) + (item.lvl ? ` L${item.lvl}` : '');
    }
    return item.name;
}

function updateBuyShardsButton() {
    const btn = document.getElementById('buy-shards-btn');
    if (btn) {
        if (window.currentLanguage === 'en') {
            btn.innerHTML = `Buy 5<img src="Ui/SoulShard.png" class="ui-icon"> for 100<img src="Ui/Coin.png" class="ui-icon">`;
        } else {
            btn.innerHTML = `Купить 5<img src="Ui/SoulShard.png" class="ui-icon"> за 100<img src="Ui/Coin.png" class="ui-icon">`;
        }
    }
}

function applyLanguage() {
    const welcomeTitle = document.querySelector('h1');
    if (welcomeTitle) welcomeTitle.innerHTML = t('welcome_title');
    
    const welcomeIntro = document.querySelector('#welcome-screen p');
    if (welcomeIntro) welcomeIntro.innerHTML = t('welcome_intro');
    
    const playBtn = document.getElementById('btn-start-game');
    if (playBtn) playBtn.innerText = t('btn_play');
    
    const settingsHeader = document.querySelector('#hub-screen div h2');
    if (settingsHeader) settingsHeader.innerText = t('settings_title');
    
    const masterLabel = document.querySelector('#mute-master').previousElementSibling;
    if (masterLabel) masterLabel.innerText = t('volume_master');
    
    const musicLabel = document.querySelector('#mute-music').previousElementSibling;
    if (musicLabel) musicLabel.innerText = t('volume_music');
    
    const sfxLabel = document.querySelector('#mute-sfx').previousElementSibling;
    if (sfxLabel) sfxLabel.innerText = t('volume_sfx');
    
    const resetBtn = document.querySelector('.btn-reset');
    if (resetBtn) resetBtn.innerText = t('btn_reset_save');
    
    const stashTitle = document.getElementById('stash-title-text') || document.querySelector('[data-container="stash"]').previousElementSibling.querySelector('h2') || document.querySelector('#hub-screen div:nth-child(2) h2');
    if (stashTitle) stashTitle.innerText = t('stash_title');
    
    const heroTitle = document.querySelector('#hub-screen div:nth-child(3) h2');
    if (heroTitle) heroTitle.innerText = t('hero_title');
    
    const statLines = document.querySelectorAll('#hub-screen .stat-line');
    statLines.forEach(line => {
        let txt = line.innerHTML;
        if (txt.includes('ЗОЛОТО') || txt.includes('GOLD')) {
            line.innerHTML = `${t('stat_gold')} <span id="hub-gold" style="color: gold;">${player.gold}</span>`;
        } else if (txt.includes('ДУШИ') || txt.includes('SHARDS')) {
            line.innerHTML = `${t('stat_shards')} <span id="hub-shards" style="color: #a020f0;">${player.shards}</span>`;
        } else if (txt.includes('ПОБЕДЫ') || txt.includes('WINS')) {
            line.innerHTML = `${t('stat_wins')} <span id="hub-wins" style="color: #00ffff;">${player.wins || 0}</span>`;
        } else if (txt.includes('УГРОЗА') || txt.includes('THREAT')) {
            let activeLevel = Math.min(3, player.selectedRaidLevel !== undefined ? player.selectedRaidLevel : (player.raidLevel || 0));
            line.innerHTML = `
                <span>${t('stat_threat')}</span>
                <div style="display: flex; gap: 5px; align-items: center;">
                    <button onclick="changeRaidLevel(-1)" class="btn-upgrade" style="min-width: 16px; padding: 2px;">&lt;</button>
                    <span id="hub-raid-lvl">${activeLevel}</span>
                    <button onclick="changeRaidLevel(1)" class="btn-upgrade" style="min-width: 16px; padding: 2px;">&gt;</button>
                </div>
            `;
        }
    });
    
    updateBuyShardsButton();
    
    const swordSlotLabel = document.querySelector('#slot-sword').previousElementSibling;
    if (swordSlotLabel) swordSlotLabel.innerText = t('slot_sword');
    
    const armorSlotLabel = document.querySelector('#slot-armor').previousElementSibling;
    if (armorSlotLabel) armorSlotLabel.innerText = t('slot_armor');
    
    const upgradesTitle = document.querySelector('#hub-screen div div[style*="border-top"] div');
    if (upgradesTitle) upgradesTitle.innerHTML = t('upgrades_title');
    
    const upgradeRows = document.querySelectorAll('#hub-screen .upgrade-row');
    upgradeRows.forEach(row => {
        let span = row.querySelector('span');
        let btn = row.querySelector('button');
        if (!span || !btn) return;
        
        let spanText = span.innerText;
        if (spanText.includes('УРОН') || spanText.includes('ATK')) {
            span.innerHTML = `${t('upgrade_atk')} <span id="hub-atk">${player.baseAtk}</span>`;
            let cost = 10 + (player.baseAtk - 5) * 5;
            btn.innerHTML = `+1 (${cost}<img src="Ui/SoulShard.png" class="ui-icon">)`;
        } else if (spanText.includes('ХП') || spanText.includes('HP')) {
            span.innerHTML = `${t('upgrade_hp')} <span id="hub-hp">${player.maxHp}</span>`;
            let cost = 15 + Math.floor((player.maxHp - 100) / 10) * 5;
            btn.innerHTML = `+10 (${cost}<img src="Ui/SoulShard.png" class="ui-icon">)`;
        } else if (spanText.includes('ДЕФ') || spanText.includes('ARM')) {
            span.innerHTML = `${t('upgrade_arm')} <span id="hub-arm">${player.armor}</span>`;
            let cost = 20 + player.armor * 10;
            btn.innerHTML = `+1 (${cost}<img src="Ui/SoulShard.png" class="ui-icon">)`;
        }
    });
    
    const raidBtn = document.getElementById('btn-raid');
    if (raidBtn) raidBtn.innerText = t('btn_raid');
    
    const raidHpLabel = document.querySelector('#raid-screen .stat-line span');
    if (raidHpLabel) raidHpLabel.innerHTML = t('gui_hp');
    
    const raidAtkLabel = document.getElementById('raid-atk-label');
    if (raidAtkLabel) raidAtkLabel.innerHTML = t('gui_atk');

    const raidArmLabel = document.getElementById('raid-arm-label');
    if (raidArmLabel) raidArmLabel.innerHTML = t('gui_arm');
    
    const raidPocketsLabel = document.getElementById('raid-pockets-title');
    if (raidPocketsLabel) raidPocketsLabel.innerText = t('gui_pockets');

    const hubPocketsLabel = document.getElementById('hub-pockets-title');
    if (hubPocketsLabel) hubPocketsLabel.innerText = t('hub_pockets_title');
    
    const ruBtn = document.getElementById('lang-ru-btn');
    const enBtn = document.getElementById('lang-en-btn');
    if (ruBtn && enBtn) {
        if (window.currentLanguage === 'ru') {
            ruBtn.style.borderColor = '#ffcc00';
            ruBtn.style.color = '#ffcc00';
            enBtn.style.borderColor = '#555';
            enBtn.style.color = '#fff';
        } else {
            enBtn.style.borderColor = '#ffcc00';
            enBtn.style.color = '#ffcc00';
            ruBtn.style.borderColor = '#555';
            ruBtn.style.color = '#fff';
        }
    }
}

function setLanguage(lang) {
    playSound('button');
    window.currentLanguage = lang;
    applyLanguage();
    if (typeof updateUi === 'function') updateUi();
    if (typeof saveGame === 'function') saveGame();
}
