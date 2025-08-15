// CyberAlchemy.js
/*:
 * @target MZ
 * @plugindesc Alchemy plugin that lets players combine items, weapons, or armor via defined recipes with an in-game selection UI + live result preview. 
 * @author Luke Acha and ChatGPT
 * 
 * @command open
 * @text Open Alchemy Menu
 * @desc Opens the alchemy crafting scene.
 *
 * @help
 * Usage:
 *  - Add the plugin and use the command "Open Alchemy Menu" from an event.
 *  - Select Slot A and Slot B from inventory, preview shows the result & costs.
 *  - Press Enter on the Result window (or choose Craft) to craft; counts refresh.
 * @param recipesFile
 * @text Recipes JSON file
 * @desc File in /data to load at boot (e.g., AlchemyRecipes.json)
 * @default AlchemyRecipes.json
 *
 * @command reload
 * @text Reload Recipes
 * @desc Reload recipes from the JSON file at runtime.

 * Notes:
 *  - If both slots use the same object, you must own at least 2.
 */

(() => {
  const CyberAlchemy = {};
    // --- config & helpers ---
  const PLUGIN_NAME = "CyberAlchemy";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const RECIPES_FILE = String(params.recipesFile || "AlchemyRecipes.json");

  function normName(s) { return String(s || "").trim(); }

  window.CyberAlchemy = CyberAlchemy; // expose for debugging

  // --- Recipes (name-based) ---
  CyberAlchemy.recipes = [
    { input: ["Blue PushPop", "Red PushPop"], output: "Purple PushPop", gold: 1024 },
   // { input: ["Rusty Helm", "makefile"], output: "Upgraded Carbon Steel Helm", gold: 1024 },
   // { input: ["Rusty Shield", "makefile"], output: "Upgraded Carbon Steel Shield", gold: 1024 },
   // { input: ["Rusty Armor", "makefile"], output: "Upgraded Carbon Steel Armor", gold: 1024 },
    { input: ["Upgraded Carbon Steel Helm", "makefile"], output: "Sentinel Helm", gold: 1024 },
    { input: ["Upgraded Carbon Steel Shield", "makefile"], output: "Sentinel Shield", gold: 1024 },
    { input: ["Upgraded Carbon Steel Armor", "makefile"], output: "Sentinel Armor", gold: 1024 },
    { input: ["Security Onion Ingredient A", "Security Onion Ingredient B"], output: "Security Onion", gold: 1024 }
  ];

  // --- Helpers ---
  CyberAlchemy.findRecipe = function(obj1, obj2) {
    if (!obj1 || !obj2) return null;
    const names = [normName(obj1.name), normName(obj2.name)].sort();
    return this.recipes.find(r => {
      const sortedInput = (r.input || []).map(normName).slice(0, 2).sort();
      return JSON.stringify(names) === JSON.stringify(sortedInput);
    }) || null;
  };


  CyberAlchemy.findDbObjectByName = function(name) {
    const pools = [$dataItems, $dataWeapons, $dataArmors];
    for (const pool of pools) {
      const obj = pool.find(o => o && o.name === name);
      if (obj) return obj;
    }
    return null;
  };

  CyberAlchemy.craft = function(obj1, obj2) {
    const recipe = this.findRecipe(obj1, obj2);
    if (!recipe) return { result: "fail" };
    if ($gameParty.gold() < recipe.gold) return { result: "notEnoughGold" };

    // Quantity checks (if same object selected twice)
    const count1 = $gameParty.numItems(obj1);
    const count2 = $gameParty.numItems(obj2);
    if (obj1 === obj2 && count1 < 2) return { result: "notEnoughQty" };
    if (count1 < 1 || count2 < 1) return { result: "notOwned" };

    $gameParty.loseGold(recipe.gold);
    $gameParty.loseItem(obj1, 1);
    $gameParty.loseItem(obj2, 1);

    const out = CyberAlchemy.findDbObjectByName(recipe.output);
    if (out) $gameParty.gainItem(out, 1);

    return { result: "success", output: out };
  };

  // --- apply JSON -> recipes (supports bare array or { recipes: [...] }) ---
  CyberAlchemy.applyExternalRecipes = function(raw) {
    try {
      if (!raw) return; // keep existing in-plugin list
      const arr = Array.isArray(raw) ? raw : raw.recipes;
      if (!Array.isArray(arr)) return;
      this.recipes = arr.map(r => ({
        input: (Array.isArray(r.input) ? r.input : []).slice(0, 2).map(normName),
        output: normName(r.output),
        gold: Number(r.gold || 0)
      })).filter(r => r.input.length >= 2 && r.output);
      console.log(`[CyberAlchemy] Loaded ${this.recipes.length} recipes from file.`);
    } catch (e) {
      console.error("[CyberAlchemy] Failed to apply external recipes:", e);
    }
  };

  // --- fetch JSON at runtime (non-blocking, safe on boot) ---
  CyberAlchemy.reloadRecipes = function() {
    const url = "data/" + RECIPES_FILE;
    return fetch(url, { cache: "no-store" })
      .then(r => r.ok ? r.json() : Promise.reject(r.status))
      .then(json => { this.applyExternalRecipes(json); return true; })
      .catch(err => { console.warn("[CyberAlchemy] Reload error:", err); return false; });
  };

  // --- boot hook: load recipes after database finishes (won’t stall boot) ---
  const _Scene_Boot_start = Scene_Boot.prototype.start;
  Scene_Boot.prototype.start = function() {
    _Scene_Boot_start.call(this);
    CyberAlchemy.reloadRecipes().then(ok => {
      if (!ok) console.warn("[CyberAlchemy] Using built-in recipes (file missing/invalid).");
    });
  };

  // --- plugin command: reload at runtime (handy while testing) ---
  PluginManager.registerCommand(PLUGIN_NAME, "reload", () => {
    CyberAlchemy.reloadRecipes().then(ok => {
      const scene = SceneManager._scene;
      if (scene && scene._helpWindow) {
        scene._helpWindow.setText(ok ? "Recipes reloaded." : "Failed to reload recipes.");
      }
    });
  });


  // ==========================
  //     SCENE & WINDOWS
  // ==========================

  class Window_AlchemySlots extends Window_Base {
    initialize(rect) {
      super.initialize(rect);
      this._slotA = null;
      this._slotB = null;
      this._cost = 0;
      this.refresh();
    }
    setSlots(a, b) {
      this._slotA = a || null;
      this._slotB = b || null;
      this.refresh();
    }
    setCost(cost) {
      this._cost = cost || 0;
      this.refresh();
    }
    drawSlot(y, label, obj) {
      const name = obj ? obj.name : "- empty -";
      this.changeTextColor(ColorManager.systemColor());
      this.drawText(label, 0, y, 120);
      this.resetTextColor();
      this.drawText(name, 120, y, this.innerWidth - 120);
    }
    refresh() {
      this.contents.clear();
      let y = 0;
      this.drawSlot(y, "Slot A:", this._slotA); y += this.lineHeight();
      this.drawSlot(y, "Slot B:", this._slotB); y += this.lineHeight();
      y += 6;
      const gold = $gameParty.gold();
      const costText = `Cost: ${this._cost} G   (Gold: ${gold})`;
      this.changeTextColor(ColorManager.systemColor());
      this.drawText(costText, 0, y, this.innerWidth);
      this.resetTextColor();
    }
  }

  // Shows predicted result + before/after counts; Enter here crafts
class Window_AlchemyResult extends Window_Selectable {
  initialize(rect) {
    super.initialize(rect);
    this._slotA = null;
    this._slotB = null;
    this._recipe = null;
    this._output = null;
    this.refresh();
  }
  maxItems() { return 1; }

  setPreview(a, b) {
    this._slotA = a || null;
    this._slotB = b || null;
    this._recipe = CyberAlchemy.findRecipe(this._slotA, this._slotB);
    this._output = this._recipe ? CyberAlchemy.findDbObjectByName(this._recipe.output) : null;
    this.refresh();
  }

  drawCountsLine(y, obj, label) {
    const have  = obj ? $gameParty.numItems(obj) : 0;
    const after = obj ? Math.max(0, have - 1) : 0;
    this.changeTextColor(ColorManager.systemColor());
    this.drawText(label, 0, y, 120);
    this.resetTextColor();
    const text = obj ? `${obj.name}: ${have} → ${after}` : "-";
    this.drawText(text, 120, y, this.innerWidth - 120);
  }

  refresh() {
    this.contents.clear();
    let y = 0;

    if (this._slotA && this._slotB && this._recipe) {
      const outName = this._output ? this._output.name : this._recipe.output;

      // Makes
     // this.changeTextColor(ColorManager.systemColor());
      //this.drawText(`Makes: ${outName}`, 0, y, this.innerWidth);
      //this.resetTextColor();
      //y += this.lineHeight();

      // Inputs
      this.drawCountsLine(y, this._slotA, ""); y += this.lineHeight();
      this.drawCountsLine(y, this._slotB, ""); y += this.lineHeight();

      // Output before → after
      const haveOut  = this._output ? $gameParty.numItems(this._output) : 0;
      const afterOut = this._output ? haveOut + 1 : 0;
      this.changeTextColor(ColorManager.systemColor());
      this.drawText("", 0, y, 120);
      this.resetTextColor();
      const outText = this._output ? `${outName}: ${haveOut} → ${afterOut}` : outName;
      this.drawText(outText, 120, y, this.innerWidth - 120);
    } else {
      this.changeTextColor(ColorManager.systemColor());
      this.drawText("No valid recipe.", 0, y, this.innerWidth);
      this.resetTextColor();
    }
  }
}

  class Window_AlchemyActions extends Window_Command {
    initialize(rect) {
      super.initialize(rect);
      this._enabledCraft = false;
    }
    makeCommandList() {
      this.addCommand("Choose Slot A", "slotA");
      this.addCommand("Choose Slot B", "slotB");
      this.addCommand("Craft", "craft", this._enabledCraft);
      this.addCommand("Clear", "clear");
      this.addCommand("Exit", "cancel");
    }
    setCraftEnabled(enabled) {
      this._enabledCraft = enabled;
      this.refresh();
    }
  }

class Window_AlchemyItemList extends Window_ItemList {
  initialize(rect) {
    super.initialize(rect);
    this._category = "item";
  }
  includes(item) {
    if (!item) return false;
    if (this._category === "item")    return DataManager.isItem(item) && item.itypeId === 1; // Items
    if (this._category === "keyItem") return DataManager.isItem(item) && item.itypeId === 2; // Key Items
    if (this._category === "weapon")  return DataManager.isWeapon(item);
    if (this._category === "armor")   return DataManager.isArmor(item);
    return false;
  }
  makeItemList() {
    if (this._category === "item") {
      // Normal items only (itypeId 1)
      this._data = $gameParty.items().filter(i => i && i.itypeId === 1);
    } else if (this._category === "keyItem") {
      this._data = $gameParty.items().filter(i => i && i.itypeId === 2);
    } else if (this._category === "weapon") {
      this._data = $gameParty.weapons().slice();
    } else if (this._category === "armor") {
      this._data = $gameParty.armors().slice();
    } else {
      this._data = [];
    }
  }

  // Don’t gate selection by “usable outside battle”
  isEnabled(_item) { return true; }
  isCurrentItemEnabled() { return true; }

  setCategory(cat) {
    if (this._category !== cat) {
      this._category = cat;
      this.refresh();
      this.select(0);
      this.ensureCursorVisible();
    }
  }
}


  class Scene_Alchemy extends Scene_MenuBase {
    create() {
      super.create();
      this.createHelpWindow();
      this._slotIndex = 0; // 0 = A, 1 = B
      this._slotA = null;
      this._slotB = null;

      this.createActionsWindow();
      this.createSlotsWindow();
      this.createResultWindow();
      this.createCategoryWindow();
      this.createItemWindow();
      this.updateCraftState();

      // Start interactive on Actions; do NOT auto-focus result
      this._actionsWindow.activate();
      this._actionsWindow.select(0);
    }

    // ---- Layout helpers (Left: Actions; Right: Slots + Result + Category + Items) ----
    actionsRect() {
      const wy = this.mainAreaTop();
      const ww = 260; // sidebar width
      const wh = this.mainAreaHeight();
      return new Rectangle(0, wy, ww, wh);
    }
    slotsRect() {
      const ax = this.actionsRect().width;
      const wy = this.mainAreaTop();
      const ww = Graphics.boxWidth - ax;
      const wh = this.calcWindowHeight(3, true); // two slots + cost line
      return new Rectangle(ax, wy, ww, wh);
    }
    resultRect() {
      const ax = this.actionsRect().width;
      const wy = this.slotsRect().y + this.slotsRect().height;
      const ww = Graphics.boxWidth - ax;
      const wh = this.calcWindowHeight(3, true); // compact preview
      return new Rectangle(ax, wy, ww, wh);
    }
    categoryRect() {
      const ax = this.actionsRect().width;
      const wy = this.resultRect().y + this.resultRect().height;
      const ww = Graphics.boxWidth - ax;
      const wh = this.calcWindowHeight(1, true);
      return new Rectangle(ax, wy, ww, wh);
    }
    itemRect() {
      const ax = this.actionsRect().width;
      const wy = this.categoryRect().y + this.categoryRect().height;
      const ww = Graphics.boxWidth - ax;
      const wh = this.mainAreaTop() + this.mainAreaHeight() - wy;
      return new Rectangle(ax, wy, ww, wh);
    }

    createActionsWindow() {
      this._actionsWindow = new Window_AlchemyActions(this.actionsRect());
      this._actionsWindow.setHandler("slotA", this.onChooseSlotA.bind(this));
      this._actionsWindow.setHandler("slotB", this.onChooseSlotB.bind(this));
      this._actionsWindow.setHandler("craft", this.onCraft.bind(this));
      this._actionsWindow.setHandler("clear", this.onClear.bind(this));
      this._actionsWindow.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._actionsWindow);
    }
    createSlotsWindow() {
      this._slotsWindow = new Window_AlchemySlots(this.slotsRect());
      this.addWindow(this._slotsWindow);
    }
    createResultWindow() {
      this._resultWindow = new Window_AlchemyResult(this.resultRect());
      this._resultWindow.setHandler("ok", this.onCraft.bind(this)); // Enter crafts
      this._resultWindow.setHandler("cancel", () => {
        this._actionsWindow.activate();
      });
      this.addWindow(this._resultWindow);
    }
    createCategoryWindow() {
      this._categoryWindow = new Window_ItemCategory(this.categoryRect());
      this._categoryWindow.select(0); // default: Items
      this._categoryWindow.setHandler("ok", this.onCategoryOk.bind(this));
      this._categoryWindow.setHandler("cancel", this.onCategoryCancel.bind(this));
      this.addWindow(this._categoryWindow);
    }
createItemWindow() {
  this._itemWindow = new Window_AlchemyItemList(this.itemRect());
  this._itemWindow.setHandler("ok", this.onItemOk.bind(this));
  this._itemWindow.setHandler("cancel", this.onItemCancel.bind(this));
  this._itemWindow.setHelpWindow(this._helpWindow);
  this.addWindow(this._itemWindow);

  if (this._categoryWindow.setItemWindow) this._categoryWindow.setItemWindow(this._itemWindow);
  const symbol = this._categoryWindow.currentSymbol ? this._categoryWindow.currentSymbol() : "item";
  this._itemWindow.setCategory(symbol);
  this._itemWindow.refresh();
  this._itemWindow.select(0);
}


onCategoryOk() {
  const symbol = this._categoryWindow.currentSymbol ? this._categoryWindow.currentSymbol() : "item";
  this._itemWindow.setCategory(symbol);
  this._itemWindow.refresh();
  this._itemWindow.activate();
  this._itemWindow.select(0);
}

    onCategoryCancel() {
      this._actionsWindow.activate();
      this._actionsWindow.select(0);
    }

    onItemOk() {
      const obj = this._itemWindow.item();
      if (!obj) { this._itemWindow.activate(); return; }
      if (this._slotIndex === 0) this._slotA = obj; else this._slotB = obj;
      this._slotsWindow.setSlots(this._slotA, this._slotB);
      this.updateCraftState();
      // Keep focus on Actions so you can immediately press Craft
      this._actionsWindow.activate();
      this._actionsWindow.select(2); // focus "Craft"
    }
    onItemCancel() {
      this._actionsWindow.activate();
    }

    onChooseSlotA() {
      this._slotIndex = 0;
      this._categoryWindow.activate();
    }
    onChooseSlotB() {
      this._slotIndex = 1;
      this._categoryWindow.activate();
    }

onClear() {
  this._slotA = null; 
  this._slotB = null;
  this._slotsWindow.setSlots(this._slotA, this._slotB);
  this._resultWindow.setPreview(this._slotA, this._slotB);

  this._helpWindow.setText("");         // <-- was: this._resultWindow.setStatus("")
  this.updateCraftState();
  this._actionsWindow.activate();
  this._actionsWindow.select(0);
}


onCraft() {
  // clear old feedback
  this._helpWindow.setText("");

  if (!this._slotA || !this._slotB) {
    SoundManager.playBuzzer();
    this._helpWindow.setText("Select two ingredients first.");
    return;
  }

  const result = CyberAlchemy.craft(this._slotA, this._slotB);
  let msg = "";

  switch (result.result) {
    case "success":
      SoundManager.playUseItem();
      msg = `Success! Created ${result.output ? result.output.name : "?"}.`;
      break;
    case "notEnoughGold":
      SoundManager.playBuzzer();
      msg = "Not enough gold.";
      break;
    case "notEnoughQty":
      SoundManager.playBuzzer();
      msg = "Need two copies to use the same item twice.";
      break;
    case "notOwned":
      SoundManager.playBuzzer();
      msg = "You don't have the required items.";
      break;
    default:
      SoundManager.playBuzzer();
      msg = "No valid recipe.";
      break;
  }

  // Show feedback in the bottom description window
  this._helpWindow.setText(msg);

  // Refresh counts + preview immediately (don’t clear slots; faster repeats)
  this._itemWindow.refresh();
  this.updateCraftState();

  // Keep focus on Craft for quick repeats
  this._actionsWindow.activate();
  this._actionsWindow.select(2);
}


    updateCraftState() {
      let cost = 0;
      if (this._slotA && this._slotB) {
        const rec = CyberAlchemy.findRecipe(this._slotA, this._slotB);
        cost = rec ? rec.gold : 0;
      }
      this._slotsWindow.setSlots(this._slotA, this._slotB);
      this._slotsWindow.setCost(cost);
      this._resultWindow.setPreview(this._slotA, this._slotB);
      const can = !!(this._slotA && this._slotB);
      this._actionsWindow.setCraftEnabled(can);
    }
  }

  // --- Plugin Command: open scene ---
PluginManager.registerCommand("CyberAlchemy", "open", () => {
  SceneManager.push(Scene_Alchemy);
});
})();

