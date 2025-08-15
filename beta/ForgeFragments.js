/*:
 * @target MZ
 * @plugindesc Cyber Forge: RNG/XOR forging for Bronze/Silver/Gold. Faces UI, popup, gold cost, runtime overrides, and item-name labels. v2.1.2 (clean)
 * @author Luke Acha and ChatGPT
 *
 * @help ForgeFragments.js
 * A forge system with two behaviors per fragment:
 * 1) RNG: weighted chance to increase/decrease by ±Min..±Max.
 * 2) XOR: bitwise transform of the current slot bonus (8 or 16-bit) using a mask (hex like 0x5A or decimal). Big swings!
 *
 * Bonuses are stored per-actor per-slot. UI shows Actor faces (top), Slots, Fragments, Preview, and a Confirm panel with a gold line.
 *
 * --- How XOR works (summary) ---
 * Clamp current slot bonus to bit-width range, bias to unsigned, XOR with the mask, un-bias to signed.
 * Delta = newSigned - oldBonus (may be a large ± swing). Use rare/expensive items for balance.
 *
 * --- Plugin Commands ---
 * Open Forge UI             → interactive scene
 * Apply Fragment            → apply directly (no UI)
 * Set Fragment Operator     → override RNG/XOR per fragment at runtime
 * Set Fragment XOR Mask     → override XOR mask per fragment at runtime
 * Reset Fragment Overrides  → clear overrides (one or all)
 *
 * ---------------------------------
 * @param BronzeUpChance
 * @text Bronze: % chance to INCREASE (RNG mode)
 * @type number
 * @min 0
 * @max 100
 * @default 55
 *
 * @param SilverUpChance
 * @text Silver: % chance to INCREASE (RNG mode)
 * @type number
 * @min 0
 * @max 100
 * @default 70
 *
 * @param GoldUpChance
 * @text Gold: % chance to INCREASE (RNG mode)
 * @type number
 * @min 0
 * @max 100
 * @default 85
 *
 * @param MinDelta
 * @text Min change per forge (RNG mode)
 * @type number
 * @min 1
 * @default 1
 *
 * @param MaxDelta
 * @text Max change per forge (RNG mode)
 * @type number
 * @min 1
 * @default 5
 *
 * @param ConsumeFragments
 * @text Consume fragment items?
 * @type boolean
 * @on Yes (consume)
 * @off No (free)
 * @default true
 *
 * @param BronzeItemId
 * @parent ConsumeFragments
 * @text Bronze Fragment Item ID
 * @type item
 * @default 0
 *
 * @param SilverItemId
 * @parent ConsumeFragments
 * @text Silver Fragment Item ID
 * @type item
 * @default 0
 *
 * @param GoldItemId
 * @parent ConsumeFragments
 * @text Gold Fragment Item ID
 * @type item
 * @default 0
 *
 * @param ChargeGold
 * @text Charge gold to forge?
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 *
 * @param BronzeGoldCost
 * @parent ChargeGold
 * @text Bronze gold cost
 * @type number
 * @min 0
 * @default 100
 *
 * @param SilverGoldCost
 * @parent ChargeGold
 * @text Silver gold cost
 * @type number
 * @min 0
 * @default 250
 *
 * @param GoldGoldCost
 * @parent ChargeGold
 * @text Gold gold cost
 * @type number
 * @min 0
 * @default 500
 *
 * @param BronzeOperator
 * @text Bronze operator (default)
 * @type select
 * @option RNG (chance ±delta)
 * @value rng
 * @option XOR 8-bit (mask)
 * @value xor8
 * @option XOR 16-bit (mask)
 * @value xor16
 * @default rng
 *
 * @param SilverOperator
 * @text Silver operator (default)
 * @type select
 * @option RNG (chance ±delta)
 * @value rng
 * @option XOR 8-bit (mask)
 * @value xor8
 * @option XOR 16-bit (mask)
 * @value xor16
 * @default rng
 *
 * @param GoldOperator
 * @text Gold operator (default)
 * @type select
 * @option RNG (chance ±delta)
 * @value rng
 * @option XOR 8-bit (mask)
 * @value xor8
 * @option XOR 16-bit (mask)
 * @value xor16
 * @default rng
 *
 * @param BronzeXorMask
 * @text Bronze XOR mask default (0x5A or 90)
 * @type text
 * @default 0x5A
 *
 * @param SilverXorMask
 * @text Silver XOR mask default (0xA7 or 167)
 * @type text
 * @default 0xA7
 *
 * @param GoldXorMask
 * @text Gold XOR mask default (0xFF or 255)
 * @type text
 * @default 0xFF
 *
 * @command OpenForge
 * @text Open Forge UI
 * @desc Opens a UI to pick Actor -> Slot -> Fragment, shows preview, then confirms.
 *
 * @command ApplyFragment
 * @text Apply Fragment (no UI)
 * @desc Apply a Bronze/Silver/Gold fragment to an actor's equipped slot directly.
 *
 * @arg actorId
 * @text Actor ID (-1 = party leader)
 * @type number
 * @default -1
 *
 * @arg slotIndex
 * @text Slot Index (0=Weapon, 1=Shield, 2=Head, 3=Body, 4=Accessory)
 * @type number
 * @min 0
 * @default 0
 *
 * @arg fragmentType
 * @text Fragment Type
 * @type select
 * @option bronze
 * @value bronze
 * @option silver
 * @value silver
 * @option gold
 * @value gold
 * @default bronze
 *
 * @command SetFragmentOperator
 * @text Set Fragment Operator
 * @desc Override a fragment to RNG / XOR8 / XOR16 at runtime.
 *
 * @arg fragmentType
 * @text Fragment
 * @type select
 * @option bronze
 * @option silver
 * @option gold
 * @default bronze
 *
 * @arg operator
 * @text Operator
 * @type select
 * @option RNG (chance ±delta)
 * @value rng
 * @option XOR 8-bit (mask)
 * @value xor8
 * @option XOR 16-bit (mask)
 * @value xor16
 * @default rng
 *
 * @command SetFragmentXorMask
 * @text Set Fragment XOR Mask
 * @desc Override a fragment's XOR mask at runtime (hex like 0x3C or decimal like 60).
 *
 * @arg fragmentType
 * @text Fragment
 * @type select
 * @option bronze
 * @option silver
 * @option gold
 * @default bronze
 *
 * @arg maskText
 * @text XOR Mask
 * @type text
 * @default 0x3C
 *
 * @command ResetFragmentOverrides
 * @text Reset Fragment Overrides
 * @desc Clear runtime overrides for one fragment or all.
 *
 * @arg fragmentType
 * @text Fragment
 * @type select
 * @option bronze
 * @option silver
 * @option gold
 * @option ALL
 * @value all
 * @default all
 */

(() => {
  const pluginName = "ForgeFragments";
  const params = PluginManager.parameters(pluginName);

  const BronzeUpChance = Number(params.BronzeUpChance || 55);
  const SilverUpChance = Number(params.SilverUpChance || 70);
  const GoldUpChance   = Number(params.GoldUpChance   || 85);
  const MinDelta       = Number(params.MinDelta       || 1);
  const MaxDelta       = Number(params.MaxDelta       || 5);
  const Consume        = String(params.ConsumeFragments) === "true";
  const BronzeItemId   = Number(params.BronzeItemId || 0);
  const SilverItemId   = Number(params.SilverItemId || 0);
  const GoldItemId     = Number(params.GoldItemId   || 0);

  const ChargeGold     = String(params.ChargeGold) === "true";
  const BronzeGoldCost = Number(params.BronzeGoldCost || 100);
  const SilverGoldCost = Number(params.SilverGoldCost || 250);
  const GoldGoldCost   = Number(params.GoldGoldCost   || 500);

  const BronzeOperator = String(params.BronzeOperator || 'rng');
  const SilverOperator = String(params.SilverOperator || 'rng');
  const GoldOperator   = String(params.GoldOperator   || 'rng');
  const BronzeXorMask  = String(params.BronzeXorMask || '0x5A');
  const SilverXorMask  = String(params.SilverXorMask || '0xA7');
  const GoldXorMask    = String(params.GoldXorMask   || '0xFF');

  // ----------------------
  // Utilities + Runtime Config
  // ----------------------
  function rngInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
  function parseIntFlexible(s) {
    if (typeof s === 'number') return s | 0;
    if (!s) return 0;
    const t = String(s).trim();
    if (/^0x[0-9a-f]+$/i.test(t)) return parseInt(t, 16) >>> 0;
    return parseInt(t, 10) >>> 0;
  }
  function fragmentToChance(type) {
    switch ((type || "").toLowerCase()) {
      case "bronze": return BronzeUpChance;
      case "silver": return SilverUpChance;
      case "gold":   return GoldUpChance;
      default: return BronzeUpChance;
    }
  }
  function fragmentToItemId(type) {
    switch ((type || "").toLowerCase()) {
      case "bronze": return BronzeItemId;
      case "silver": return SilverItemId;
      case "gold":   return GoldItemId;
      default: return 0;
    }
  }
  function fragmentToGoldCost(type) {
    switch ((type || "").toLowerCase()) {
      case "bronze": return BronzeGoldCost;
      case "silver": return SilverGoldCost;
      case "gold":   return GoldGoldCost;
      default: return 0;
    }
  }

  // Runtime overrides live on $gameSystem._forgeConfig
  const _Game_System_initialize = Game_System.prototype.initialize;
  Game_System.prototype.initialize = function() {
    _Game_System_initialize.call(this);
    this._forgeConfig = this._forgeConfig || { bronze:{}, silver:{}, gold:{} };
  };
  Game_System.prototype.forgeCfg = function(type) {
    this._forgeConfig = this._forgeConfig || { bronze:{}, silver:{}, gold:{} };
    const key = String(type || '').toLowerCase();
    return this._forgeConfig[key] || (this._forgeConfig[key] = {});
  };
  Game_System.prototype.setForgeOperator = function(type, operator) {
    const cfg = this.forgeCfg(type); cfg.operator = String(operator || '');
  };
  Game_System.prototype.setForgeMask = function(type, maskText) {
    const cfg = this.forgeCfg(type); cfg.mask = String(maskText || '');
  };
  Game_System.prototype.resetForgeOverrides = function(type) {
    if (!this._forgeConfig) this._forgeConfig = { bronze:{}, silver:{}, gold:{} };
    if (!type || String(type).toLowerCase() === 'all') {
      this._forgeConfig = { bronze:{}, silver:{}, gold:{} };
    } else {
      this._forgeConfig[String(type).toLowerCase()] = {};
    }
  };

  function fragmentToOperator(type) {
    const t = String(type || '').toLowerCase();
    const cfg = $gameSystem ? $gameSystem.forgeCfg(t) : {};
    if (cfg && cfg.operator) return String(cfg.operator);
    switch (t) {
      case 'bronze': return BronzeOperator;
      case 'silver': return SilverOperator;
      case 'gold':   return GoldOperator;
      default: return 'rng';
    }
  }
  function fragmentToMask(type) {
    const t = String(type || '').toLowerCase();
    const cfg = $gameSystem ? $gameSystem.forgeCfg(t) : {};
    if (cfg && cfg.mask) return parseIntFlexible(cfg.mask);
    switch (t) {
      case 'bronze': return parseIntFlexible(BronzeXorMask);
      case 'silver': return parseIntFlexible(SilverXorMask);
      case 'gold':   return parseIntFlexible(GoldXorMask);
      default: return 0;
    }
  }
  function fragmentLabel(type) {
    const t = String(type || '').toLowerCase();
    return t.charAt(0).toUpperCase() + t.slice(1);
  }
  function fragmentItemName(type) {
    const id = fragmentToItemId(type);
    const item = id ? $dataItems[id] : null;
    return (item && item.name) ? String(item.name) : `${fragmentLabel(type)} Fragment`;
  }
  function actorByIdOrLeader(id) {
    return id === -1 ? $gameParty.leader() : $gameActors.actor(id);
  }
  function slotItemType(item) {
    if (!item) return null;
    if (DataManager.isWeapon(item)) return 'weapon';
    if (DataManager.isArmor(item))  return 'armor';
    return null;
  }
  function slotLabelFor(actor, slotIndex) {
    const etypeId = actor.equipSlots()[slotIndex];
    return $dataSystem.equipTypes[etypeId] || `Slot ${slotIndex}`;
  }
  function computeXorDelta(oldBonus, widthBits, mask) {
    const max  = (1 << widthBits) - 1;
    const bias = 1 << (widthBits - 1);
    const clamped = Math.max(-bias, Math.min(bias - 1, Number(oldBonus) || 0));
    const biased  = (clamped + bias) & max;
    const m       = (mask == null ? rngInt(0, max) : (mask & max));
    const resultB = (biased ^ m) & max;
    const newS    = resultB - bias;
    const delta   = newS - clamped;
    return { delta, newSigned: newS, mask: m };
  }

  // ----------------------
  // Persist & Apply bonuses
  // ----------------------
  const _Game_Actor_setup = Game_Actor.prototype.setup;
  Game_Actor.prototype.setup = function(actorId) {
    _Game_Actor_setup.call(this, actorId);
    this._forgeBonuses = this._forgeBonuses || {};
  };
  Game_Actor.prototype.forgeBonusFor = function(slotIndex) {
    this._forgeBonuses = this._forgeBonuses || {};
    if (!this._forgeBonuses[slotIndex]) this._forgeBonuses[slotIndex] = { atk: 0, def: 0 };
    return this._forgeBonuses[slotIndex];
  };
  Game_Actor.prototype.resetForgeBonus = function(slotIndex) {
    this._forgeBonuses = this._forgeBonuses || {};
    delete this._forgeBonuses[slotIndex];
  };

  Game_Actor.prototype.applyForge = function(slotIndex, fragmentType, opts) {
    opts = opts || {}; const silent = !!opts.silent;
    const equips = this.equips(); const equip = equips[slotIndex];
    if (!equip) return { ok:false, reason: 'No equipment in that slot.' };
    const t = slotItemType(equip); if (!t) return { ok:false, reason: 'Invalid equipment type.' };

    // Resources
    if (Consume) {
      const itemId = fragmentToItemId(fragmentType);
      if (!itemId) return { ok:false, reason: 'Fragment item ID not set in plugin params.' };
      const itemData = $dataItems[itemId];
      if (!itemData) return { ok:false, reason: 'Fragment item not found in database.' };
      if ($gameParty.numItems(itemData) <= 0) return { ok:false, reason: `You don't have ${fragmentItemName(fragmentType)}.` };
    }
    const goldCost = ChargeGold ? fragmentToGoldCost(fragmentType) : 0;
    if (ChargeGold && $gameParty.gold() < goldCost) return { ok:false, reason: `Not enough gold (need ${goldCost}g).` };

    // Operation
    const oper = fragmentToOperator(fragmentType);
    const bonus = this.forgeBonusFor(slotIndex);
    const old = (t === 'weapon') ? (bonus.atk || 0) : (bonus.def || 0);
    let delta = 0, magnitude = 0, increase = false;

    if (oper === 'rng') {
      const upChance = fragmentToChance(fragmentType);
      const inc = rngInt(1,100) <= upChance;
      const mag = rngInt(Math.max(1, MinDelta), Math.max(MinDelta, MaxDelta));
      delta = inc ? mag : -mag;
      magnitude = Math.abs(delta);
      increase = inc;
    } else if (oper === 'xor8' || oper === 'xor16') {
      const width = (oper === 'xor8') ? 8 : 16;
      const mask = fragmentToMask(fragmentType);
      const out = computeXorDelta(old, width, mask);
      delta = out.delta; magnitude = Math.abs(delta); increase = delta >= 0;
    } else {
      const upChance = fragmentToChance(fragmentType);
      const inc = rngInt(1,100) <= upChance;
      const mag = rngInt(Math.max(1, MinDelta), Math.max(MinDelta, MaxDelta));
      delta = inc ? mag : -mag; magnitude = Math.abs(delta); increase = inc;
    }

    if (t === 'weapon') bonus.atk = (bonus.atk || 0) + delta; else bonus.def = (bonus.def || 0) + delta;

    if (Consume) { const id = fragmentToItemId(fragmentType); $gameParty.loseItem($dataItems[id], 1, false); }
    if (ChargeGold && goldCost > 0) $gameParty.loseGold(goldCost);

    const paramName = (t === 'weapon') ? 'ATK' : 'DEF';
    const totalVal  = (t === 'weapon') ? (bonus.atk || 0) : (bonus.def || 0);

    try { AudioManager.playSe({ name: increase ? 'Equip1' : 'Buzzer1', volume: 90, pitch: 100, pan: 0 }); } catch(e) {}

    if (!silent) {
      $gameMessage.add(`${this.name()} forged ${equip.name} with ${fragmentItemName(fragmentType)}!`);
      $gameMessage.add(`${paramName} ${increase?'+':'-'}${magnitude} (total: ${paramName} ${totalVal>=0?'+':''}${totalVal}).`);
      if (ChargeGold && goldCost > 0) $gameMessage.add(`Cost: ${goldCost}g`);
    }

    return { ok:true, increase, magnitude, type:t, paramName, total: totalVal, equipName: equip.name, fragment: fragmentType, goldCost, delta };
  };

  const _Game_Actor_paramPlus = Game_Actor.prototype.paramPlus;
  Game_Actor.prototype.paramPlus = function(paramId) {
    let v = _Game_Actor_paramPlus.call(this, paramId);
    this._forgeBonuses = this._forgeBonuses || {};
    const equips = this.equips();
    for (let i = 0; i < equips.length; i++) {
      const eq = equips[i]; if (!eq) continue;
      const b = this._forgeBonuses[i]; if (!b) continue;
      if (DataManager.isWeapon(eq) && paramId === 2) v += b.atk || 0; // ATK
      else if (DataManager.isArmor(eq) && paramId === 3) v += b.def || 0; // DEF
    }
    return v;
  };

  // ----------------------
  // UI Scene & Windows
  // ----------------------
  class Scene_Forge extends Scene_MenuBase {
    create() {
      super.create();
      this.createHelpWindow();
      this._helpWindow.visible = false; this._helpWindow.openness = 0;
      this.createActorWindow();
      this.createSlotWindow();
      this.createFragmentWindow();
      this.createPreviewWindow();
      this.createConfirmWindow();
      this.refreshAll();
      this._actorWindow.activate();
    }
    actorsWindowRect() {
      const m=8; const wx=m, wy=m; const ww=Graphics.boxWidth-m*2; const wh=200;
      return new Rectangle(wx, wy, ww, wh);
    }
    slotWindowRect() {
      const m=8; const top=this.actorsWindowRect().y + this.actorsWindowRect().height + m;
      const ww=Math.floor((Graphics.boxWidth - m*3)/2);
      const wx=m, wy=top, wh=180;
      return new Rectangle(wx, wy, ww, wh);
    }
    fragmentWindowRect() {
      const m=8; const top=this.actorsWindowRect().y + this.actorsWindowRect().height + m;
      const ww=Math.floor((Graphics.boxWidth - m*3)/2);
      const wx=m*2 + ww, wy=top, wh=180;
      return new Rectangle(wx, wy, ww, wh);
    }
    previewWindowRect() {
      const m=8; const top=this.slotWindowRect().y + this.slotWindowRect().height + m;
      const wx=m; const ww=Graphics.boxWidth - m*2; const wh=170;
      return new Rectangle(wx, top, ww, wh);
    }
    confirmWindowRect() {
      const r=this.previewWindowRect(); const ww=360; const wh=this.calcWindowHeight(3, true); // Gold + Forge + Cancel
      const wx=r.x + r.width - ww; const wy=r.y + r.height - wh;
      return new Rectangle(wx, wy, ww, wh);
    }

    createActorWindow() {
      this._actorWindow = new Window_ForgeActors(this.actorsWindowRect());
      this._actorWindow.setHandler('ok', this.onActorOk.bind(this));
      this._actorWindow.setHandler('cancel', this.popScene.bind(this));
      this._actorWindow.onIndexChanged = this.onActorIndexChanged.bind(this);
      this.addWindow(this._actorWindow);
    }
    createSlotWindow() {
      this._slotWindow = new Window_ForgeSlots(this.slotWindowRect());
      this._slotWindow.setHandler('ok', this.onSlotOk.bind(this));
      this._slotWindow.setHandler('cancel', this.onSlotCancel.bind(this));
      this._slotWindow.onIndexChanged = this.refreshPreview.bind(this);
      this.addWindow(this._slotWindow);
    }
    createFragmentWindow() {
      this._fragmentWindow = new Window_ForgeFragments(this.fragmentWindowRect());
      this._fragmentWindow.setHandler('ok', this.onFragmentOk.bind(this));
      this._fragmentWindow.setHandler('cancel', this.onFragmentCancel.bind(this));
      this._fragmentWindow.onIndexChanged = this.refreshPreview.bind(this);
      this.addWindow(this._fragmentWindow);
    }
    createPreviewWindow() { this._previewWindow = new Window_ForgePreview(this.previewWindowRect()); this.addWindow(this._previewWindow); }
    createConfirmWindow() {
      this._confirmWindow = new Window_ForgeConfirm(this.confirmWindowRect());
      this._confirmWindow.setHandler('ok', this.onConfirmOk.bind(this));
      this._confirmWindow.setHandler('cancel', this.onConfirmCancel.bind(this));
      this.addWindow(this._confirmWindow);
    }

    showResultPopup(lines) {
      const padding=24; const w=Math.min(Graphics.boxWidth-48, Math.max(520, Math.floor(Graphics.boxWidth*0.85)));
      const lineH=Window_Base.prototype.lineHeight.call(this);
      const textH=Math.max(lineH*(lines.length||2)+padding, lineH*3+padding);
      const okH=this.calcWindowHeight(1,true); const totalH=textH+okH+12;
      const x=Math.floor((Graphics.boxWidth-w)/2); const y=Math.floor((Graphics.boxHeight-totalH)/2);

      this._resultText = new Window_ForgeResultText(new Rectangle(x, y, w, textH));
      this._resultText.setLines(lines);
      this.addWindow(this._resultText);

      const okRect = new Rectangle(x + w - 200, y + textH + 6, 200, okH);
      this._resultOk = new Window_ForgeResultOk(okRect);
      this._resultOk.setHandler('ok', this.closeResultPopup.bind(this));
      this.addWindow(this._resultOk);
      this._resultOk.activate();
    }
    closeResultPopup() {
      const remove = (w) => { if (!w) return; if (w.parent) w.parent.removeChild(w); if (w.destroy) w.destroy({ children:true }); };
      remove(this._resultText); this._resultText=null;
      remove(this._resultOk);   this._resultOk=null;
      if (this._fragmentWindow) this._fragmentWindow.activate();
      else if (this._slotWindow) this._slotWindow.activate();
      else if (this._actorWindow) this._actorWindow.activate();
    }

    currentActor() {
      const id = this._actorWindow.currentExt();
      return id ? $gameActors.actor(id) : ($gameParty.members()[this._actorWindow.index()] || null);
    }
    currentSlotIndex() { return this._slotWindow ? this._slotWindow.currentExt() : null; }
    currentFragmentType() { return this._fragmentWindow ? this._fragmentWindow.currentExt() : null; }

    onActorIndexChanged() { const actor = this.currentActor(); this._slotWindow.setActor(actor); this.refreshPreview(); }
    refreshAll() { const actor = this.currentActor(); this._slotWindow.setActor(actor); this.refreshPreview(); }
    refreshPreview() {
      const actor=this.currentActor(); const slotIndex=this.currentSlotIndex(); const frag=this.currentFragmentType();
      this._previewWindow.setData(actor, slotIndex, frag);
      let ready = !!(actor && typeof slotIndex === 'number' && frag);
      let cost = 0;
      if (frag) {
        if (ChargeGold) { cost = fragmentToGoldCost(frag); if ($gameParty.gold() < cost) ready = false; }
        if (Consume) { const id = fragmentToItemId(frag); if (id) { const have = $gameParty.numItems($dataItems[id]); if (have <= 0) ready = false; } }
      }
      this._confirmWindow.setContext(cost);
      this._confirmWindow.setReady(ready);
    }

    onActorOk() { this._slotWindow.activate(); }
    onSlotOk() { this._fragmentWindow.activate(); }
    onFragmentOk() { this._confirmWindow.activate(); }
    onSlotCancel() { this._actorWindow.activate(); }
    onFragmentCancel() { this._slotWindow.activate(); }
    onConfirmCancel() { this._fragmentWindow.activate(); }

    onConfirmOk() {
      const actor=this.currentActor(); const slotIndex=this.currentSlotIndex(); const frag=this.currentFragmentType();
      if (actor && typeof slotIndex === 'number' && frag) {
        const result = actor.applyForge(slotIndex, frag, { silent:true });
        if (!result.ok) {
          this.showResultPopup([`Forge failed: ${result.reason || 'Unknown error'}`]);
        } else {
          const sign = result.increase ? '+' : '-';
          const line1 = `${actor.name()} forged ${result.equipName} with ${fragmentItemName(result.fragment)}!`;
          const line2 = `${result.paramName} ${sign}${result.magnitude}  (total: ${result.paramName} ${result.total>=0?'+':''}${result.total})`;
          const costLine = (ChargeGold && result.goldCost > 0) ? `Cost: ${result.goldCost}g` : null;
          this.showResultPopup(costLine ? [line1, line2, costLine] : [line1, line2]);
          this.refreshAll(); this._fragmentWindow.refresh();
        }
      }
    }
  }

  class Window_ForgeActors extends Window_Command {
    initialize(rect) {
      super.initialize(rect);
      this.select(0); this._lastIndex = -1;
      for (const a of $gameParty.members()) {
        if (a && a.faceName()) {
          const bmp = ImageManager.loadFace(a.faceName());
          if (bmp && !bmp.isReady()) bmp.addLoadListener(() => this.refresh());
        }
      }
    }
    maxCols() { return 4; }
    numVisibleRows() { return 2; }
    itemHeight() { return 180; }
    makeCommandList() { for (const a of $gameParty.members()) this.addCommand(a.name(), 'ok', true, a.actorId()); }
    drawItem(index) {
      const rect = this.itemRect(index);
      const actorId = (this._list && this._list[index] ? this._list[index].ext : null);
      const actor = $gameActors.actor(actorId); if (!actor) return;
      const fx = rect.x + 8, fy = rect.y + 8;
      const fw = Math.min(144, rect.width - 16), fh = Math.min(144, this.itemHeight() - this.lineHeight() - 16);
      if (actor.faceName()) {
        this.drawFace(actor.faceName(), actor.faceIndex(), fx, fy, fw, fh);
      } else if (actor.characterName()) {
        const bmp = ImageManager.loadCharacter(actor.characterName());
        const big = ImageManager.isBigCharacter(actor.characterName());
        const pw = bmp ? bmp.width / (big ? 3 : 12) : 48;
        const ph = bmp ? bmp.height / (big ? 4 : 8) : 48;
        const sx = (actor.characterIndex() % 4) * 3 * pw;
        const sy = Math.floor(actor.characterIndex() / 4) * 4 * ph;
        const cx = fx + Math.floor((fw - pw) / 2);
        const cy = fy + Math.floor((fh - ph) / 2);
        if (bmp && bmp.isReady()) this.contents.blt(bmp, sx, sy, pw, ph, cx, cy);
        else if (bmp) bmp.addLoadListener(() => this.refresh());
      }
      const nameY = fy + fh + 4;
      this.drawText(actor.name(), rect.x, nameY, rect.width, 'center');
    }
    update() {
      super.update();
      if (this.index() !== this._lastIndex) { this._lastIndex = this.index(); if (this.onIndexChanged) this.onIndexChanged(); }
    }
    currentExt() { return super.currentExt(); }
  }

  class Window_ForgeSlots extends Window_Command {
    initialize(rect) { super.initialize(rect); this._actor = null; this._lastIndex = -1; }
    setActor(actor) { this._actor = actor; this.refresh(); this.select(0); this._lastIndex = -1; if (this.onIndexChanged) this.onIndexChanged(); }
    maxCols() { return 1; }
    numVisibleRows() { return Math.min(8, this.maxItems()); }
    makeCommandList() {
      this.clearCommandList(); if (!this._actor) return;
      const equips = this._actor.equips();
      for (let i = 0; i < equips.length; i++) {
        const eq = equips[i]; if (!eq) continue; const t = slotItemType(eq); if (!t) continue;
        this.addCommand(`${slotLabelFor(this._actor, i)}: ${eq.name}`, 'ok', true, i);
      }
      if (this.maxItems() === 0) this.addCommand('(No forgeable equipment)', 'cancel', false, null);
    }
    update() { super.update(); if (this.index() !== this._lastIndex) { this._lastIndex = this.index(); if (this.onIndexChanged) this.onIndexChanged(); } }
    currentExt() { return super.currentExt(); }
  }

  class Window_ForgeFragments extends Window_Command {
    initialize(rect) { super.initialize(rect); this.select(2); this._lastIndex = -1; }
    maxCols() { return 1; }
    numVisibleRows() { return 3; }
    makeCommandList() {
      const invStr = (id) => { if (!Consume || !id) return ' | (free)'; const item = $dataItems[id]; if (!item) return ' | (?)'; return ` | x${$gameParty.numItems(item)}`; };
      const opStr  = (op) => (op === 'rng' ? '' : (op === 'xor8' ? ' | op XOR8' : ' | op XOR16'));
      const costStr= (t) => ChargeGold ? ` | ${fragmentToGoldCost(t)}g` : '';
      const rngInfo= (t) => (fragmentToOperator(t) === 'rng' ? ` | ↑${fragmentToChance(t)}%` : '');
      const opB=fragmentToOperator('bronze'), opS=fragmentToOperator('silver'), opG=fragmentToOperator('gold');
      this.addCommand(`${fragmentItemName('bronze')}${rngInfo('bronze')}${invStr(BronzeItemId)}${costStr('bronze')}${opStr(opB)}`, 'ok', true, 'bronze');
      this.addCommand(`${fragmentItemName('silver')}${rngInfo('silver')}${invStr(SilverItemId)}${costStr('silver')}${opStr(opS)}`, 'ok', true, 'silver');
      this.addCommand(`${fragmentItemName('gold')}${rngInfo('gold')}${invStr(GoldItemId)}${costStr('gold')}${opStr(opG)}`, 'ok', true, 'gold');
    }
    update() { super.update(); if (this.index() !== this._lastIndex) { this._lastIndex = this.index(); if (this.onIndexChanged) this.onIndexChanged(); } }
    currentExt() { return super.currentExt(); }
  }

  class Window_ForgePreview extends Window_Base {
    initialize(rect) { super.initialize(rect); this._actor=null; this._slotIndex=null; this._frag=null; }
    setData(actor, slotIndex, frag) { this._actor=actor; this._slotIndex=slotIndex; this._frag=frag; this.refresh(); }
    drawCentered(y, text) { this.drawText(text, 0, y, this.innerWidth, 'center'); }
    refresh() {
      this.contents.clear();
      if (!this._actor) { this.drawCentered(0, 'Select an actor.'); return; }
      const eqs = this._actor.equips();
      const eq  = (typeof this._slotIndex === 'number') ? eqs[this._slotIndex] : null;
      if (!eq) { this.drawCentered(0, 'Select a forgeable slot with an equipped item.'); return; }
      const t = slotItemType(eq); if (!t) { this.drawCentered(0, 'Selected slot is not forgeable.'); return; }

      const lh = this.lineHeight(); let y = 0;
      this.drawText(`Item: ${eq.name}  [${slotLabelFor(this._actor, this._slotIndex)}]`, 0, y, this.innerWidth); y += lh;
      const b = this._actor.forgeBonusFor(this._slotIndex);
      const pName = (t === 'weapon') ? 'ATK' : 'DEF';
      const total = (t === 'weapon') ? (b.atk || 0) : (b.def || 0);
      this.drawText(`Current slot bonus: ${pName} ${total>=0?'+':''}${total}`, 0, y, this.innerWidth); y += lh;

      if (!this._frag) { this.drawText('Pick a fragment to see details.', 0, y, this.innerWidth); return; }

      const op = fragmentToOperator(this._frag);
      if (op === 'rng') {
        const up = fragmentToChance(this._frag);
        const minD = Math.max(1, MinDelta), maxD = Math.max(minD, MaxDelta);
        const id = fragmentToItemId(this._frag);
        const have = id ? $gameParty.numItems($dataItems[id]) : 0;
        const consumeStr = Consume ? `Consumes 1x ${fragmentItemName(this._frag)}` : 'No item consumed';
        const costStr = ChargeGold ? ` + ${fragmentToGoldCost(this._frag)}g` : '';
        this.drawText(`Mode: RNG  (↑${up}%)`, 0, y, this.innerWidth); y += lh;
        this.drawText(`Delta range: ±${minD} .. ±${maxD}`, 0, y, this.innerWidth); y += lh;
        this.drawText(consumeStr + (Consume ? ` (You have: ${have})` : '') + costStr, 0, y, this.innerWidth); y += lh;
        if (Consume && id && have <= 0) { this.changeTextColor(ColorManager.crisisColor()); this.drawText('Not enough fragments!', 0, y, this.innerWidth); this.resetTextColor(); }
        if (ChargeGold && $gameParty.gold() < fragmentToGoldCost(this._frag)) { this.changeTextColor(ColorManager.crisisColor()); this.drawText('Not enough gold!', 0, y + lh, this.innerWidth); this.resetTextColor(); }
      } else {
        const width = (op === 'xor8') ? 8 : 16;
        const mask = fragmentToMask(this._frag);
        const id = fragmentToItemId(this._frag);
        const have = id ? $gameParty.numItems($dataItems[id]) : 0;
        const consumeStr = Consume ? `Consumes 1x ${fragmentItemName(this._frag)}` : 'No item consumed';
        const costStr = ChargeGold ? ` + ${fragmentToGoldCost(this._frag)}g` : '';
        this.drawText(`Mode: XOR ${width}-bit (mask ${mask ? '0x' + mask.toString(16).toUpperCase() : 'random'})`, 0, y, this.innerWidth); y += lh;
        this.drawText(`Effect: rewrites ${pName} slot bonus bits → LARGE ± swing`, 0, y, this.innerWidth); y += lh;
        this.drawText(consumeStr + (Consume ? ` (You have: ${have})` : '') + costStr, 0, y, this.innerWidth); y += lh;
        if (Consume && id && have <= 0) { this.changeTextColor(ColorManager.crisisColor()); this.drawText('Not enough fragments!', 0, y, this.innerWidth); this.resetTextColor(); }
        if (ChargeGold && $gameParty.gold() < fragmentToGoldCost(this._frag)) { this.changeTextColor(ColorManager.crisisColor()); this.drawText('Not enough gold!', 0, y + lh, this.innerWidth); this.resetTextColor(); }
      }
    }
  }

  class Window_ForgeConfirm extends Window_Command {
    initialize(rect) { super.initialize(rect); this._ready=false; this._cost=0; this.deactivate(); }
    setReady(r) { this._ready=r; this.refresh(); }
    setContext(c) { this._cost=c||0; this.refresh(); }
    maxCols() { return 1; }
    numVisibleRows() { return 3; } // Gold + Forge + Cancel
    makeCommandList() {
      this.clearCommandList();
      this.addCommand(`Gold: ${$gameParty.gold()}g`, 'noop', false);
      const label = this._cost > 0 ? `Forge! (${this._cost}g)` : 'Forge!';
      this.addCommand(label, 'ok', this._ready);
      this.addCommand('Cancel', 'cancel', true);
    }
    refresh() {
      Window_Command.prototype.refresh.call(this);
      if (this.index() <= 0 && this.maxItems() >= 2) this.select(1);
    }
  }

  class Window_ForgeResultText extends Window_Base {
    initialize(rect) { super.initialize(rect); this._lines = []; }
    setLines(lines) { this._lines = lines || []; this.refresh(); }
    refresh() { this.contents.clear(); let y=0; for (const t of this._lines) { this.drawText(t, 0, y, this.innerWidth, 'center'); y += this.lineHeight(); } }
  }
  class Window_ForgeResultOk extends Window_Command {
    initialize(rect) { super.initialize(rect); this.select(0); }
    maxCols() { return 1; }
    numVisibleRows() { return 1; }
    makeCommandList() { this.addCommand('OK', 'ok'); }
  }

  // ----------------------
  // Plugin Commands
  // ----------------------
  PluginManager.registerCommand(pluginName, 'OpenForge', () => {
    SceneManager.push(Scene_Forge);
  });
  PluginManager.registerCommand(pluginName, 'ApplyFragment', (args) => {
    const actorId = Number(args.actorId || -1);
    const slotIndex = Number(args.slotIndex || 0);
    const fragmentType = String(args.fragmentType || 'bronze');
    const actor = actorByIdOrLeader(actorId);
    if (!actor) { $gameMessage.add('[Forge] Invalid actor.'); return; }
    const equips = actor.equips();
    if (slotIndex < 0 || slotIndex >= equips.length) { $gameMessage.add('[Forge] Invalid slot index.'); return; }
    const result = actor.applyForge(slotIndex, fragmentType, { silent:false });
    if (!result.ok && result.reason) $gameMessage.add(`[Forge] ${result.reason}`);
  });
  PluginManager.registerCommand(pluginName, 'SetFragmentOperator', (args) => {
    const t = String(args.fragmentType || 'bronze').toLowerCase();
    const op = String(args.operator || 'rng');
    if ($gameSystem) $gameSystem.setForgeOperator(t, op);
  });
  PluginManager.registerCommand(pluginName, 'SetFragmentXorMask', (args) => {
    const t = String(args.fragmentType || 'bronze').toLowerCase();
    const m = String(args.maskText || '0x3C');
    if ($gameSystem) $gameSystem.setForgeMask(t, m);
  });
  PluginManager.registerCommand(pluginName, 'ResetFragmentOverrides', (args) => {
    const t = String(args.fragmentType || 'all').toLowerCase();
    if ($gameSystem) $gameSystem.resetForgeOverrides(t);
  });
})();

