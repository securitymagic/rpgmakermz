/*:
 * @target MZ
 * @plugindesc Dev Tool: Build and export alchemy recipes to JSON (Items/Weapons/Armors).
 * @author You
 *
 * @param recipesFile
 * @text Recipes JSON file
 * @desc File name in /data to write and read, e.g. AlchemyRecipes.json
 * @default AlchemyRecipes.json
 *
 * @command openBuilder
 * @text Open Recipe Builder
 * @desc Opens the developer recipe builder scene.
 */

(() => {
  const PLUGIN_NAME = "CyberAlchemyBuilder";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const RECIPES_FILE = String(params.recipesFile || "AlchemyRecipes.json");

  // Node access (playtest only)
  const fs = (Utils.isNwjs() ? require("fs") : null);
  const path = (Utils.isNwjs() ? require("path") : null);

  // --------------------------
  // Small helpers
  // --------------------------
  function norm(s){ return String(s || "").trim(); }
  function isOkNode() { return !!(fs && path); }
  function projectRoot() {
    // In NW.js, the project root is dirname of the executable or index.html
    const base = path.dirname(process.mainModule.filename);
    return base;
  }
  function dataPath(file) {
    return path.join(projectRoot(), "data", file);
  }

  // --------------------------
  // Windows
  // --------------------------
  class Window_CAB_Slots extends Window_Base {
    initialize(rect) { super.initialize(rect); this._a=null; this._b=null; this._out=null; this._gold=1024; this.refresh(); }
    setSlots(a,b,out){ this._a=a||null; this._b=b||null; this._out=out||null; this.refresh(); }
    setGold(v){ this._gold = Math.max(0, Number(v||0)|0); this.refresh(); }
    refresh(){
      this.contents.clear();
      let y=0;
      const drawLine = (label,obj) => {
        this.changeTextColor(ColorManager.systemColor());
        this.drawText(label,0,y,140); this.resetTextColor();
        this.drawText(obj?obj.name:"- none -", 140, y, this.innerWidth-140);
        y+=this.lineHeight();
      };
      drawLine("Ingredient A:", this._a);
      drawLine("Ingredient B:", this._b);
      drawLine("Output:", this._out);
      y+=6;
this.changeTextColor(ColorManager.systemColor());
this.drawText(`Cost:`, 0, y, 120);
this.resetTextColor();
this.drawText(String(this._gold) + " G", 120, y, this.innerWidth - 120, "right");
      this.resetTextColor();
    }
  }

  class Window_CAB_Actions extends Window_Command {
    initialize(rect){ super.initialize(rect); }
    makeCommandList(){
      this.addCommand("Choose A", "slotA");
      this.addCommand("Choose B", "slotB");
      this.addCommand("Choose Output", "slotOut");
      this.addCommand("Cost -100", "costDown");
      this.addCommand("Cost +100", "costUp");
      this.addCommand("Add Recipe", "add");
      this.addCommand("Load JSON", "load");
      this.addCommand("Save JSON", "save");
      this.addCommand("Clear Form", "clear");
      this.addCommand("Exit", "cancel");
    }
  }

  class Window_CAB_Category extends Window_ItemCategory {}

class Window_CAB_ItemList extends Window_ItemList {
  initialize(rect){ super.initialize(rect); this._category = "item"; }

  // Show DB objects by category (not limited to party inventory)
  makeItemList() {
    const all = []
      .concat($dataItems || [], $dataWeapons || [], $dataArmors || [])
      .filter(Boolean);
    this._data = all.filter(i => this.includes(i));
  }

  includes(item){
    if (!item) return false;
    if (this._category === "item")    return DataManager.isItem(item)    && item.itypeId === 1;
    if (this._category === "keyItem") return DataManager.isItem(item)    && item.itypeId === 2;
    if (this._category === "weapon")  return DataManager.isWeapon(item);
    if (this._category === "armor")   return DataManager.isArmor(item);
    return false;
  }

  // Always allow selecting any DB entry in the builder
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


  class Window_CAB_Recipes extends Window_Selectable {
    initialize(rect){ super.initialize(rect); this._recipes=[]; this.refresh(); }
    setRecipes(list){ this._recipes=list||[]; this.refresh(); }
    maxItems(){ return this._recipes.length; }
    itemAt(i){ return this._recipes[i]; }
    drawItem(index){
      const r = this.itemAt(index); if(!r) return;
      const rect = this.itemRect(index);
      const line = `${r.input[0]} + ${r.input[1]} -> ${r.output}  [${r.gold}G]`;
      this.drawText(line, rect.x, rect.y, rect.width);
    }
  }

  // --------------------------
  // Scene
  // --------------------------
  class Scene_CABuilder extends Scene_MenuBase {
    create(){
      super.create();
      this.createHelpWindow();

      this._slotA=null; this._slotB=null; this._slotOut=null; this._gold=1024;
      this._recipes = []; // working list

      this.createSlotsWindow();
      this.createActionsWindow();
      this.createCategoryWindow();
      this.createItemWindow();
      this.createRecipeListWindow();

      this._actions.activate(); this._actions.select(0);
      this._mode = "A"; // which slot we are filling from list
    }

    // Layout
    actionsRect(){ const wy=this.mainAreaTop(); const ww=240; const wh=this.mainAreaHeight(); return new Rectangle(0,wy,ww,wh); }
    slotsRect(){ const ax=this.actionsRect().width; const wy=this.mainAreaTop(); const ww=Graphics.boxWidth-ax; const wh=this.calcWindowHeight(4,true); return new Rectangle(ax,wy,ww,wh); }
    recListRect(){ const ax=this.actionsRect().width; const wy=this.slotsRect().y+this.slotsRect().height; const ww=Graphics.boxWidth-ax; const wh=this.calcWindowHeight(2,true); return new Rectangle(ax,wy,ww,wh); }
    catRect(){ const ax=this.actionsRect().width; const wy=this.recListRect().y+this.recListRect().height; const ww=Graphics.boxWidth-ax; const wh=this.calcWindowHeight(1,true); return new Rectangle(ax,wy,ww,wh); }
    itemRect(){ const ax=this.actionsRect().width; const wy=this.catRect().y+this.catRect().height; const ww=Graphics.boxWidth-ax; const wh=this.mainAreaTop()+this.mainAreaHeight()-wy; return new Rectangle(ax,wy,ww,wh); }

    createSlotsWindow(){ this._slots = new Window_CAB_Slots(this.slotsRect()); this.addWindow(this._slots); this.refreshSlots(); }
    createActionsWindow(){
      this._actions = new Window_CAB_Actions(this.actionsRect());
      this._actions.setHandler("slotA", this.onSlotA.bind(this));
      this._actions.setHandler("slotB", this.onSlotB.bind(this));
      this._actions.setHandler("slotOut", this.onSlotOut.bind(this));
      this._actions.setHandler("costDown", this.onCostDown.bind(this));
      this._actions.setHandler("costUp", this.onCostUp.bind(this));
      this._actions.setHandler("add", this.onAddRecipe.bind(this));
      this._actions.setHandler("load", this.onLoad.bind(this));
      this._actions.setHandler("save", this.onSave.bind(this));
      this._actions.setHandler("clear", this.onClearForm.bind(this));
      this._actions.setHandler("cancel", this.popScene.bind(this));
      this.addWindow(this._actions);
    }
    createCategoryWindow(){
      this._cat = new Window_CAB_Category(this.catRect());
      this._cat.setHandler("ok", this.onCategoryOk.bind(this));
      this._cat.setHandler("cancel", this.onCategoryCancel.bind(this));
      this.addWindow(this._cat);
      this._cat.select(0);
    }
    createItemWindow(){
      this._items = new Window_CAB_ItemList(this.itemRect());
      this._items.setHelpWindow(this._helpWindow);
      this._items.setHandler("ok", this.onPickItem.bind(this));
      this._items.setHandler("cancel", this.onItemCancel.bind(this));
      this.addWindow(this._items);
      // initial populate
      const sym = this._cat.currentSymbol ? this._cat.currentSymbol() : "item";
      this._items.setCategory(sym);
      this._items.refresh();
      this._items.select(0);
    }
    createRecipeListWindow(){
      this._list = new Window_CAB_Recipes(this.recListRect());
      this.addWindow(this._list);
      this._list.setRecipes(this._recipes);
    }

    refreshSlots(){ this._slots.setSlots(this._slotA, this._slotB, this._slotOut); this._slots.setGold(this._gold); }

    // Handlers
    onSlotA(){ this._mode="A"; this._helpWindow.setText("Pick Ingredient A"); this._cat.activate(); }
    onSlotB(){ this._mode="B"; this._helpWindow.setText("Pick Ingredient B"); this._cat.activate(); }
    onSlotOut(){ this._mode="OUT"; this._helpWindow.setText("Pick Output (Item/Weapon/Armor)"); this._cat.activate(); }

    onCostDown(){ this._gold = Math.max(0, this._gold - 100); this.refreshSlots(); this._actions.activate(); }
    onCostUp(){ this._gold += 100; this.refreshSlots(); this._actions.activate(); }

    onCategoryOk(){
      const sym = this._cat.currentSymbol ? this._cat.currentSymbol() : "item";
      this._items.setCategory(sym);
      this._items.refresh();
      this._items.activate();
      this._items.select(0);
    }
    onCategoryCancel(){ this._actions.activate(); this._actions.select(0); }

    onPickItem(){
      const obj = this._items.item(); if(!obj){ this._items.activate(); return; }
      if(this._mode==="A") this._slotA = obj;
      else if(this._mode==="B") this._slotB = obj;
      else this._slotOut = obj;
      this._helpWindow.setText(`${this._mode} set to: ${obj.name}`);
      this.refreshSlots();
      this._actions.activate();
      this._actions.select(5); // focus "Add Recipe"
    }
    onItemCancel(){ this._actions.activate(); }

    onAddRecipe(){
      if(!this._slotA || !this._slotB || !this._slotOut){
        SoundManager.playBuzzer(); this._helpWindow.setText("Set A, B, and Output first."); return;
      }
      const r = {
        input: [ norm(this._slotA.name), norm(this._slotB.name) ],
        output: norm(this._slotOut.name),
        gold: this._gold|0
      };
      this._recipes.push(r);
      SoundManager.playOk();
      this._helpWindow.setText(`Added: ${r.input[0]} + ${r.input[1]} -> ${r.output} [${r.gold}G]`);
      this._list.setRecipes(this._recipes);
      this._list.refresh();
      this._actions.activate();
      this._actions.select(7); // Save JSON
    }

    onClearForm(){
      this._slotA = this._slotB = this._slotOut = null;
      this._gold = 1024;
      this.refreshSlots();
      this._helpWindow.setText("Form cleared.");
      this._actions.activate();
    }

    onLoad(){
      if(!isOkNode()){ SoundManager.playBuzzer(); this._helpWindow.setText("Load only works in playtest (NW.js)."); return; }
      const file = dataPath(RECIPES_FILE);
      try{
        const txt = fs.readFileSync(file, "utf8");
        // Allow bare array or wrapped
        let json = JSON.parse(txt);
        const arr = Array.isArray(json) ? json : json.recipes;
        if(!Array.isArray(arr)) throw new Error("Invalid format: expected array or {recipes:[]}");
        // normalize
        this._recipes = arr.map(r => ({
          input: [norm(r.input?.[0]), norm(r.input?.[1])],
          output: norm(r.output),
          gold: Number(r.gold||0)|0
        })).filter(r => r.input[0] && r.input[1] && r.output);
        this._list.setRecipes(this._recipes); this._list.refresh();
        SoundManager.playOk();
        this._helpWindow.setText(`Loaded ${this._recipes.length} recipes from ${RECIPES_FILE}.`);
      }catch(e){
        console.error(e);
        SoundManager.playBuzzer();
        this._helpWindow.setText(`Load failed: ${e.message}`);
      }
      this._actions.activate();
    }

    onSave(){
      if(!isOkNode()){ SoundManager.playBuzzer(); this._helpWindow.setText("Save only works in playtest (NW.js)."); return; }
      const file = dataPath(RECIPES_FILE);
      try{
        const json = JSON.stringify(this._recipes, null, 2);
        fs.writeFileSync(file, json, "utf8");
        SoundManager.playOk();
        this._helpWindow.setText(`Saved ${this._recipes.length} recipes → data/${RECIPES_FILE}`);
      }catch(e){
        console.error(e);
        SoundManager.playBuzzer();
        this._helpWindow.setText(`Save failed: ${e.message}`);
      }
      this._actions.activate();
    }
  }

  // Command to open builder
  PluginManager.registerCommand(PLUGIN_NAME, "openBuilder", () => {
    SceneManager.push(Scene_CABuilder);
  });
})();
