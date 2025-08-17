/*:
 * @target MZ
 * @plugindesc World Map at a glance (tiles + parallax), chunked snapshot for huge maps + multi-region hide by switches. v2.0
 * @author You
 *
 * @param WorldMapId
 * @text World Map ID (0 = current map)
 * @type number
 * @min 0
 * @default 1
 *
 * @param WorldXVarId
 * @text World X Variable ID (fallback)
 * @type variable
 * @default 0
 *
 * @param WorldYVarId
 * @text World Y Variable ID (fallback)
 * @type variable
 * @default 0
 *
 * @param MarkerPicture
 * @text Marker Picture (img/pictures)
 * @type file
 * @dir img/pictures
 * @default
 *
 * @param BlankColor
 * @text Blank Color
 * @type string
 * @desc CSS color to paint hidden region tiles (e.g., #000000).
 * @default #000000
 *
 * @param HideRules
 * @text Hide Rules
 * @type struct<HideRule>[]
 * @default []
 * @desc Each rule: RegionId + SwitchId (while switch is OFF, region is hidden; when ON, it reveals)
 *
 * @param ShowDebug
 * @text Show Debug Overlay
 * @type boolean
 * @default false
 *
 * @command OpenWorldMap
 * @text Open World Map
 * @arg mapId
 * @text Override Map ID (optional, 0 = current)
 * @type number
 * @min 0
 */

/*~struct~HideRule:
 * @param RegionId
 * @text Region ID
 * @type number
 * @min 1
 * @max 255
 * @default 1
 *
 * @param SwitchId
 * @text Unlock Switch
 * @type switch
 * @desc While this switch is OFF the region stays hidden; when it turns ON the region reveals.
 * @default 0
 */

(() => {
  const PLUGIN = "WorldMapViewer";
  const P = PluginManager.parameters(PLUGIN);

  const PARAM_MAP_ID = Number(P.WorldMapId || 1);
  const WORLD_X_VAR  = Number(P.WorldXVarId || 0);
  const WORLD_Y_VAR  = Number(P.WorldYVarId || 0);
  const MARKER_PIC   = String(P.MarkerPicture || "");
  const BLANK_COLOR  = String(P.BlankColor || "#000000");
  const SHOW_DEBUG   = String(P.ShowDebug || "false") === "true";

  // Parse HideRules (array of structs)
  const parseStructArray = (json) => {
    try {
      const arr = JSON.parse(json);
      return arr.map(s => JSON.parse(s));
    } catch (e) {
      return [];
    }
  };
  let HIDE_RULES = parseStructArray(P.HideRules).map(r => ({
    regionId: Number(r.RegionId || 0),
    switchId: Number(r.SwitchId || 0),
  })).filter(r => r.regionId > 0 && r.switchId > 0);

  // --- Back-compat: convert old single params to one rule if they exist ---
  // (You can ignore this if you never set them.)
  const oldHideRegion = Number(P.HideRegionId || 0);
  const oldHideSwitch = Number(P.HideSwitchId || 0);
  if (!HIDE_RULES.length && oldHideRegion > 0 && oldHideSwitch > 0) {
    HIDE_RULES = [{ regionId: oldHideRegion, switchId: oldHideSwitch }];
  }

  let _wmvNextOverrideId = 0;

  PluginManager.registerCommand(PLUGIN, "OpenWorldMap", args => {
    _wmvNextOverrideId = Number(args?.mapId || 0) || 0;
    SceneManager.push(Scene_WorldMapView);
  });

  // Item hook: <WorldMapItem>
  const _Scene_Item_useItem = Scene_Item.prototype.useItem;
  Scene_Item.prototype.useItem = function () {
    const item = this.item();
    if (item && /<WorldMapItem>/i.test(item.note || "")) {
      SoundManager.playOk();
      _wmvNextOverrideId = 0;
      SceneManager.push(Scene_WorldMapView);
      this.activateItemWindow();
      return;
    }
    _Scene_Item_useItem.call(this);
  };

  //============================================================================
  // Scene
  //============================================================================
  function Scene_WorldMapView(){ this.initialize(...arguments); }
  Scene_WorldMapView.prototype = Object.create(Scene_Base.prototype);
  Scene_WorldMapView.prototype.constructor = Scene_WorldMapView;

  Scene_WorldMapView.prototype.initialize = function(){
    Scene_Base.prototype.initialize.call(this);
    this._tileW = $gameMap.tileWidth();
    this._tileH = $gameMap.tileHeight();
    this._state = "loading";
    this._mapData = null;
    this._tilemap = null;
    this._tilemapBitmaps = null;
    this._sheetInfo = [];
    this._parallaxBmp = null;
    this._targetMapId = _wmvNextOverrideId || (PARAM_MAP_ID || $gameMap.mapId());
    _wmvNextOverrideId = 0;

    const pad3 = n => ("000"+n).slice(-3);
    DataManager.loadDataFile("__WMV_Map", `Map${pad3(this._targetMapId)}.json`);
  };

  Scene_WorldMapView.prototype.create = function(){
    Scene_Base.prototype.create.call(this);
    const bg = new Sprite(new Bitmap(Graphics.width, Graphics.height));
    bg.bitmap.fillRect(0,0,Graphics.width,Graphics.height,"#000");
    this.addChild(bg);

    if (SHOW_DEBUG) {
      this._debug = new Sprite(new Bitmap(Graphics.width, 100));
      this.addChild(this._debug);
    }
  };

  Scene_WorldMapView.prototype.update = function(){
    Scene_Base.prototype.update.call(this);
    if (Input.isTriggered("cancel") || TouchInput.isCancelled()) {
      SoundManager.playCancel();
      SceneManager.pop();
      return;
    }

    if (this._state === "loading") {
      const m = window.__WMV_Map;
      if (m && m.data && m.width && m.height && m.tilesetId != null) {
        this._mapData = m;
        this._prepareAssets();
        this._state = "assets";
      }
      return;
    }

    if (this._state === "assets") {
      if (this._assetsReady()) {
        this._buildSnapshot();   // chunked renderer
        window.__WMV_Map = null;
        this._state = "ready";
      }
      return;
    }
  };

  //---- Helpers
  Scene_WorldMapView.prototype._prepareAssets = function(){
    const map = this._mapData;
    const tileset = $dataTilesets[map.tilesetId];

    const VP_LIMIT = 1024;
    const vpW = Math.min(VP_LIMIT, Graphics.width);
    const vpH = Math.min(VP_LIMIT, Graphics.height);

    if (tileset) {
      const t = new Tilemap();
      t.tileWidth = this._tileW;
      t.tileHeight = this._tileH;
      t.setData(map.width, map.height, map.data);
      t.horizontalWrap = false;
      t.verticalWrap = false;
      t.flags = tileset.flags;

      const bitmaps = [];
      for (let i=0;i<9;i++){
        const n = tileset.tilesetNames[i];
        bitmaps[i] = n ? ImageManager.loadTileset(n) : new Bitmap();
      }
      if (typeof t.setBitmaps === "function") t.setBitmaps(bitmaps);
      else t.bitmaps = bitmaps;

      t.width = vpW;
      t.height = vpH;
      if (t.setFrame) t.setFrame(0,0,vpW,vpH);
      t.refresh();

      this._tilemap = t;
      this._tilemapBitmaps = bitmaps;

      const labels = ["A1","A2","A3","A4","A5","B","C","D","E"];
      this._sheetInfo = labels.map((lbl, i) => {
        const name = tileset.tilesetNames[i] || "(none)";
        const bmp = bitmaps[i];
        const ok = bmp && (!bmp.isReady || bmp.isReady());
        return `${lbl}:${name}${ok ? "" : " [missing/not ready]"}`;
      });
    } else {
      this._sheetInfo = ["Tileset:(none)"];
    }

    if (map.parallaxName) {
      this._parallaxBmp = ImageManager.loadParallax(map.parallaxName);
    }
  };

  Scene_WorldMapView.prototype._assetsReady = function(){
    const tilesReady = !this._tilemapBitmaps || this._tilemapBitmaps.every(b => !b.isReady || b.isReady());
    const parallaxReady = !this._parallaxBmp || this._parallaxBmp.isReady();
    return tilesReady && parallaxReady;
  };

  Scene_WorldMapView.prototype._worldXY = function(){
    if ($gameMap.mapId() === this._targetMapId) {
      return { x:$gamePlayer.x, y:$gamePlayer.y };
    }
    const vx = WORLD_X_VAR > 0 ? Number($gameVariables.value(WORLD_X_VAR)) : 0;
    const vy = WORLD_Y_VAR > 0 ? Number($gameVariables.value(WORLD_Y_VAR)) : 0;
    return { x:vx, y:vy };
  };

  // Region ID from the loaded map JSON (layer 5)
  Scene_WorldMapView.prototype._regionIdFromData = function(x, y){
    const map = this._mapData;
    if (x < 0 || y < 0 || x >= map.width || y >= map.height) return 0;
    const idx = (5 * map.height + y) * map.width + x;
    return map.data[idx] || 0;
  };

  // Is this tile hidden under the current switch states?
  Scene_WorldMapView.prototype._isHiddenRegion = function(regionId){
    if (!HIDE_RULES.length || regionId <= 0) return false;
    for (const r of HIDE_RULES) {
      if (r.regionId === regionId) {
        const unlocked = $gameSwitches.value(r.switchId); // ON means revealed
        return !unlocked; // hidden while OFF
      }
    }
    return false;
  };

  // Build an overlay that paints hidden (locked) tiles in BLANK_COLOR.
  // We pre-scale to the miniature’s scale (s) so we can render directly into RT.
  Scene_WorldMapView.prototype._makeRegionOverlayScaled = function(scale){
    if (!HIDE_RULES.length) return null;
    const map = this._mapData;
    const g = new PIXI.Graphics();
    const color = PIXI.utils.string2hex(BLANK_COLOR);
    const twS = this._tileW * scale;
    const thS = this._tileH * scale;

    for (let y = 0; y < map.height; y++){
      let runStart = -1, runLen = 0;
      for (let x = 0; x < map.width; x++){
        const hidden = this._isHiddenRegion(this._regionIdFromData(x, y));
        if (hidden){
          if (runStart < 0) { runStart = x; runLen = 1; }
          else runLen++;
        } else if (runStart >= 0) {
          g.beginFill(color, 1);
          g.drawRect(runStart * twS, y * thS, runLen * twS, thS);
          g.endFill();
          runStart = -1; runLen = 0;
        }
      }
      if (runStart >= 0) {
        g.beginFill(color, 1);
        g.drawRect(runStart * twS, y * thS, runLen * twS, thS);
        g.endFill();
      }
    }
    return g;
  };

  // -------- CHUNKED SNAPSHOT (Pixi v5) ----------
  Scene_WorldMapView.prototype._buildSnapshot = function(){
    const map = this._mapData;
    const fullW = map.width * this._tileW;
    const fullH = map.height * this._tileH;
    const s = Math.min(Graphics.width / fullW, Graphics.height / fullH); // final scale

    const rtW = Math.max(1, Math.floor(fullW * s));
    const rtH = Math.max(1, Math.floor(fullH * s));
    const renderer = Graphics.app.renderer;

    // Create RenderTexture (v5/v7 compatible)
    let rt = PIXI.RenderTexture.create({ width: rtW, height: rtH });
    if (!rt || !rt.baseTexture) rt = PIXI.RenderTexture.create(rtW, rtH);

    const mat = new PIXI.Matrix();

    // 1) Parallax (once)
    if (this._parallaxBmp) {
      const par = new Sprite(this._parallaxBmp);
      par.scale.set(fullW / this._parallaxBmp.width, fullH / this._parallaxBmp.height);
      mat.a = s; mat.b = 0; mat.c = 0; mat.d = s; mat.tx = 0; mat.ty = 0;
      renderer.render(par, rt, true, mat); // clear=true on first
    }

    // 2) Tiles: chunk render with 1-tile overlap to hide seams
    if (this._tilemap) {
      const chunkW = this._tilemap.width;
      const chunkH = this._tilemap.height;
      let first = !this._parallaxBmp;
      const overlap = this._tileW;
      const stepX = Math.max(1, chunkW - overlap);
      const stepY = Math.max(1, chunkH - overlap);

      for (let oy = 0; oy < fullH; oy += stepY) {
        for (let ox = 0; ox < fullW; ox += stepX) {
          this._tilemap.origin.x = ox;
          this._tilemap.origin.y = oy;
          this._tilemap.update();

          mat.a = s; mat.b = 0; mat.c = 0; mat.d = s;
          mat.tx =  ox * s;   // positive offset = place chunk at its position
          mat.ty =  oy * s;

          renderer.render(this._tilemap, rt, first, mat);
          first = false;
        }
      }
    } else if (!this._parallaxBmp) {
      renderer.render(new PIXI.Container(), rt, true);
    }

    // 3) Region-hide overlay (if any rules)
    const overlay = this._makeRegionOverlayScaled(s);
    if (overlay) renderer.render(overlay, rt, false);

    // Show miniature
    const mini = new PIXI.Sprite(rt);
    mini.x = (Graphics.width  - rtW) / 2;
    mini.y = (Graphics.height - rtH) / 2;
    this.addChild(mini);
    this._miniSprite = mini;

    // Marker
    const {x, y} = this._worldXY();
    const px = Math.floor((x * this._tileW + this._tileW / 2) * s);
    const py = Math.floor((y * this._tileH + this._tileH / 2) * s);

    let marker;
    if (MARKER_PIC) {
      marker = new Sprite(ImageManager.loadPicture(MARKER_PIC));
      marker.anchor.set(0.5, 1.0);
    } else {
      const size = 10;
      const bmp = new Bitmap(size, size);
      bmp.fillRect(0, 0, size, size, "#ffffff");
      bmp.clearRect(1, 1, size - 2, size - 2);
      bmp.fillRect(2, 2, size - 4, size - 4, "#ff3b30");
      marker = new Sprite(bmp);
      marker.anchor.set(0.5, 0.5);
    }
    marker.x = mini.x + px;
    marker.y = mini.y + py;
    this.addChild(marker);

    // Debug overlay
    if (SHOW_DEBUG) {
      const tilesetObj = $dataTilesets[map.tilesetId];
      const tilesetLabel = tilesetObj ? (tilesetObj.name || tilesetObj.id) : map.tilesetId;

      const b = this._debug.bitmap;
      b.clear();
      b.fontSize = 22;
      b.outlineWidth = 4; b.outlineColor = "black"; b.textColor = "yellow";
      const header = `MapID:${this._targetMapId}  Size:${map.width}x${map.height}  Tileset:${tilesetLabel}  Parallax:${map.parallaxName || "(none)"}`;
      b.drawText(header, 0, 0, Graphics.width, 28, "center");

      b.fontSize = 18; b.textColor = "white";
      const sheets = (this._sheetInfo || []).join("  |  ");
      b.drawText(sheets, 0, 28, Graphics.width, 24, "center");

      if (HIDE_RULES.length) {
        const states = HIDE_RULES
          .map(r => `R${r.regionId}@S${r.switchId}:${$gameSwitches.value(r.switchId) ? "ON(visible)" : "OFF(hidden)"}`)
          .join("  |  ");
        b.textColor = "cyan";
        b.drawText(states, 0, 52, Graphics.width, 24, "center");
      }
    }
  };
})();
