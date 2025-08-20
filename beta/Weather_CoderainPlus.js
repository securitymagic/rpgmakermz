/*:
 * @target MZ
 * @plugindesc Weather: 'coderain' + thunder bursts + fog + darken + PNG tile mode + rain BGS/SE loop (v1.3)
 * @author You
 *
 * @help Weather_CoderainPlus.js (v1.3)
 * - PNG tile name is now configurable via Plugin Manager (Default PNG Tile).
 * - You can also switch PNGs at runtime via "Coderain: Tile Set Image".
 *
 * === DEFAULTS (configure in Plugin Manager) ===
 *
 * @param DefaultTileImage
 * @text Default PNG Tile (img/pictures)
 * @type file
 * @dir img/pictures
 * @default Code_rain_green_512
 *
 * @param DefaultFogImage
 * @text Default Fog Image (img/pictures)
 * @type file
 * @dir img/pictures
 * @default Fog01
 *
 * === CODERAIN (particles) defaults ===
 * @param ColorHex       @type string @default #00E676
 * @param HeadHex        @type string @default #E9FFE9
 * @param StreakWidth    @type number @min 1 @max 8 @default 2
 * @param StreakLength   @type number @min 16 @max 128 @default 64
 * @param FallSpeedAt9   @text Fall Speed at Power 9 (px/frame) @type number @min 1 @max 32 @default 10
 * @param BlendMode      @type select @option normal @value normal @option add @value add @option screen @value screen @option multiply @value multiply @default screen
 *
 * === COMMANDS: CODERAIN PARTICLES ===
 * @command Coderain:Start
 * @text Coderain: Start (particles)
 * @arg power @type number @min 0 @max 9 @default 8
 * @arg duration @type number @min 0 @max 9999 @default 60
 *
 * @command Coderain:Stop
 * @text Coderain: Stop (particles)
 * @arg duration @type number @min 0 @max 9999 @default 45
 *
 * @command Coderain:SetPower
 * @text Coderain: Set Power (particles)
 * @arg power @type number @min 0 @max 9 @default 6
 * @arg duration @type number @min 0 @max 9999 @default 30
 *
 * @command Coderain:SetVisuals
 * @text Coderain: Set Visuals (particles)
 * @arg colorHex @type string @default #00E676
 * @arg headHex  @type string @default #E9FFE9
 * @arg width    @type number @min 1 @max 8 @default 2
 * @arg length   @type number @min 16 @max 128 @default 64
 * @arg fallSpeedAt9 @type number @min 1 @max 32 @default 10
 * @arg blend    @type select @option normal @value normal @option add @value add @option screen @value screen @option multiply @value multiply @default screen
 *
 * === COMMANDS: CODERAIN PNG TILE MODE ===
 * @command Coderain:TileStart
 * @text Coderain: Tile Start (PNG)
 * @desc Uses a PNG tile instead of particles. Leave Image blank to use Default PNG Tile param.
 * @arg image   @type file @dir img/pictures @default
 * @arg opacity @type number @min 0 @max 255 @default 200
 * @arg blend   @type select @option normal @value normal @option add @value add @option screen @value screen @option multiply @value multiply @default screen
 * @arg speedX  @type number @decimals 2 @default 0
 * @arg speedY  @type number @decimals 2 @default 1
 *
 * @command Coderain:TileSet
 * @text Coderain: Tile Set (PNG)
 * @arg opacity @type number @min 0 @max 255 @default 200
 * @arg blend   @type select @option normal @value normal @option add @value add @option screen @value screen @option multiply @value multiply @default screen
 * @arg speedX  @type number @decimals 2 @default 0
 * @arg speedY  @type number @decimals 2 @default 1
 *
 * @command Coderain:TileSetImage
 * @text Coderain: Tile Set Image
 * @desc Switch the PNG tile used by coderain tile mode.
 * @arg image @type file @dir img/pictures @default
 *
 * @command Coderain:TileStop
 * @text Coderain: Tile Stop (PNG)
 * @arg fadeFrames @type number @min 0 @max 600 @default 30
 *
 * === COMMANDS: THUNDER (bursts) ===
 * @command Thunder:Enable
 * @text Thunder: Enable (bursts)
 * @arg seName        @type file @dir audio/se @default Thunder1
 * @arg volMin        @type number @min 0 @max 100 @default 80
 * @arg volMax        @type number @min 0 @max 100 @default 95
 * @arg pitchMin      @type number @min 50 @max 150 @default 90
 * @arg pitchMax      @type number @min 50 @max 150 @default 110
 * @arg minSeconds    @type number @decimals 2 @min 0.5 @max 60 @default 6
 * @arg maxSeconds    @type number @decimals 2 @min 0.6 @max 120 @default 14
 * @arg burstMin      @text Burst Min Strikes @type number @min 1 @max 10 @default 1
 * @arg burstMax      @text Burst Max Strikes @type number @min 1 @max 10 @default 3
 * @arg interMinFrames @text Inter-Strike Min (frames) @type number @min 1 @max 120 @default 6
 * @arg interMaxFrames @text Inter-Strike Max (frames) @type number @min 1 @max 120 @default 18
 * @arg flashPowerMin @type number @min 0 @max 255 @default 140
 * @arg flashPowerMax @type number @min 0 @max 255 @default 220
 * @arg flashFramesMin @type number @min 1 @max 180 @default 10
 * @arg flashFramesMax @type number @min 1 @max 180 @default 20
 *
 * @command Thunder:Disable
 * @text Thunder: Disable
 *
 * === COMMANDS: FOG ===
 * @command Fog:Enable
 * @text Fog: Enable
 * @arg image   @type file @dir img/pictures @default
 * @arg opacity @type number @min 0 @max 255 @default 160
 * @arg speedX  @type number @decimals 2 @default 0.2
 * @arg speedY  @type number @decimals 2 @default 0
 * @arg blend   @type select @option normal @value normal @option add @value add @option screen @value screen @option multiply @value multiply @default normal
 *
 * @command Fog:Disable
 * @text Fog: Disable
 * @arg fadeFrames @type number @min 0 @max 600 @default 45
 *
 * @command Fog:Set
 * @text Fog: Set
 * @arg opacity @type number @min 0 @max 255 @default 160
 * @arg speedX  @type number @decimals 2 @default 0.2
 * @arg speedY  @type number @decimals 2 @default 0
 * @arg blend   @type select @option normal @value normal @option add @value add @option screen @value screen @option multiply @value multiply @default normal
 *
 * === COMMANDS: DARKEN ===
 * @command Darken:Enable
 * @text Darken: Enable
 * @arg opacity @type number @min 0 @max 255 @default 120
 * @arg fadeFrames @type number @min 0 @max 600 @default 30
 *
 * @command Darken:Disable
 * @text Darken: Disable
 * @arg fadeFrames @type number @min 0 @max 600 @default 30
 *
 * === COMMANDS: RAIN AUDIO ===
 * @command RainBGS:Enable
 * @text Rain BGS: Enable (loop)
 * @arg name   @type file @dir audio/bgs @default Rain
 * @arg volume @type number @min 0 @max 100 @default 80
 * @arg pitch  @type number @min 50 @max 150 @default 100
 * @arg pan    @type number @min -100 @max 100 @default 0
 *
 * @command RainBGS:Disable
 * @text Rain BGS: Disable
 * @arg fadeSec @type number @decimals 2 @min 0 @max 30 @default 2
 *
 * @command RainSE:EnableLoop
 * @text Rain SE: Enable Loop (patter)
 * @arg name     @type file @dir audio/se @default Water2
 * @arg volume   @type number @min 0 @max 100 @default 60
 * @arg pitchMin @type number @min 50 @max 150 @default 90
 * @arg pitchMax @type number @min 50 @max 150 @default 110
 * @arg intMin   @text Interval Min (sec) @type number @decimals 2 @min 0.2 @max 60 @default 1.2
 * @arg intMax   @text Interval Max (sec) @type number @decimals 2 @min 0.3 @max 60 @default 2.4
 *
 * @command RainSE:DisableLoop
 * @text Rain SE: Disable Loop
 */

(function() {
  "use strict";

  const P = PluginManager.parameters("Weather_CoderainPlus");

  // -- helpers --
  const BLENDS = {
    normal: PIXI.BLEND_MODES.NORMAL,
    add: PIXI.BLEND_MODES.ADD,
    screen: PIXI.BLEND_MODES.SCREEN,
    multiply: PIXI.BLEND_MODES.MULTIPLY
  };
  const parseHex = (hex, fb) => {
    const m = /^#?([0-9a-f]{6})$/i.exec(String(hex || ""));
    if (!m) return fb;
    const n = parseInt(m[1], 16);
    return { r:(n>>16)&255, g:(n>>8)&255, b:n&255 };
  };

  // -- defaults from params --
  const DEFAULT_TILE = String(P.DefaultTileImage || "Code_rain_green_512");
  const DEFAULT_FOG  = String(P.DefaultFogImage  || "Fog01");

  let COL   = parseHex(P.ColorHex || "#00E676", {r:0,g:230,b:118});
  let HEAD  = parseHex(P.HeadHex  || "#E9FFE9", {r:233,g:255,b:233});
  let WIDTH = Math.max(1, Number(P.StreakWidth   || 2));
  let LEN   = Math.max(16, Number(P.StreakLength || 64));
  let SPEED_Y_9 = Math.max(1, Number(P.FallSpeedAt9 || 10));
  let BLEND = BLENDS[String(P.BlendMode || "screen")] ?? PIXI.BLEND_MODES.SCREEN;

  // -- persistent state --
  function S() {
    if (!$gameSystem._coderainPlus) {
      $gameSystem._coderainPlus = {
        thunderOn:false,
        thunder:{
          se:"Thunder1", volMin:80, volMax:95, pitchMin:90, pitchMax:110,
          min:6, max:14, burstMin:1, burstMax:3, interMin:6, interMax:18,
          pMin:140, pMax:220, fMin:10, fMax:20, burstTimer:0, strikesLeft:0, intraTimer:0
        },
        fog:{on:false, bmpName:DEFAULT_FOG, op:160, sx:0.2, sy:0, blend:"normal", fade:0},
        darken:{target:0, alpha:0, fade:0},
        tile:{on:false, bmpName:DEFAULT_TILE, op:200, sx:0, sy:1, blend:"screen", fade:0},
        seLoop:{on:false, name:"Water2", vol:60, pMin:90, pMax:110, iMin:1.2, iMax:2.4, timer:0}
      };
    }
    return $gameSystem._coderainPlus;
  }

  // -- plugin commands --
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:Start",a=>{
    $gameScreen.changeWeather("coderain", Number(a.power||8), Number(a.duration||60));
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:Stop",a=>{
    $gameScreen.changeWeather("none", 0, Number(a.duration||45));
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:SetPower",a=>{
    $gameScreen.changeWeather("coderain", Number(a.power||6), Number(a.duration||30));
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:SetVisuals",a=>{
    COL = parseHex(a.colorHex||"#00E676", COL);
    HEAD = parseHex(a.headHex||"#E9FFE9", HEAD);
    WIDTH = Math.max(1, Number(a.width||WIDTH));
    LEN = Math.max(16, Number(a.length||LEN));
    SPEED_Y_9 = Math.max(1, Number(a.fallSpeedAt9||SPEED_Y_9));
    BLEND = BLENDS[String(a.blend||"screen")] ?? BLEND;
    if (SceneManager._scene?._spriteset?._weather) {
      SceneManager._scene._spriteset._weather._coderainBitmap = null;
    }
  });

  // PNG tile mode
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:TileStart",a=>{
    const st=S().tile;
    st.on=true;
    st.bmpName = String(a.image || st.bmpName || DEFAULT_TILE);
    st.op = Math.max(0,Math.min(255,Number(a.opacity||200)));
    st.blend = String(a.blend||"screen");
    st.sx = Number(a.speedX||0);
    st.sy = Number(a.speedY||1);
    st.fade=0;
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:TileSet",a=>{
    const st=S().tile;
    st.op=Math.max(0,Math.min(255,Number(a.opacity||st.op)));
    st.blend=String(a.blend||st.blend);
    st.sx=Number(a.speedX||st.sx);
    st.sy=Number(a.speedY||st.sy);
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:TileSetImage",a=>{
    const st=S().tile;
    st.bmpName = String(a.image || DEFAULT_TILE);
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Coderain:TileStop",a=>{
    const st=S().tile; st.fade=Math.max(0,Number(a.fadeFrames||30)); st.on=false;
  });

  // Thunder bursts (unchanged from v1.2)
  PluginManager.registerCommand("Weather_CoderainPlus","Thunder:Enable",a=>{
    const t=S().thunder;
    S().thunderOn=true;
    t.se=String(a.seName||"Thunder1");
    t.volMin=Number(a.volMin||80); t.volMax=Number(a.volMax||95);
    t.pitchMin=Number(a.pitchMin||90); t.pitchMax=Number(a.pitchMax||110);
    t.min=Math.max(0.5,Number(a.minSeconds||6));
    t.max=Math.max(t.min+0.1,Number(a.maxSeconds||14));
    t.burstMin=Math.max(1,Number(a.burstMin||1));
    t.burstMax=Math.max(t.burstMin,Number(a.burstMax||3));
    t.interMin=Math.max(1,Number(a.interMinFrames||6));
    t.interMax=Math.max(t.interMin,Number(a.interMaxFrames||18));
    t.pMin=Math.max(0,Math.min(255,Number(a.flashPowerMin||140)));
    t.pMax=Math.max(t.pMin,Math.min(255,Number(a.flashPowerMax||220)));
    t.fMin=Math.max(1,Number(a.flashFramesMin||10));
    t.fMax=Math.max(t.fMin,Number(a.flashFramesMax||20));
    t.burstTimer = Math.floor(t.min*60 + Math.random()*(t.max - t.min)*60);
    t.strikesLeft=0; t.intraTimer=0;
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Thunder:Disable",()=>{
    S().thunderOn=false; const t=S().thunder; t.burstTimer=0; t.strikesLeft=0; t.intraTimer=0;
  });

  // Fog
  PluginManager.registerCommand("Weather_CoderainPlus","Fog:Enable",a=>{
    const f=S().fog;
    f.on=true; f.bmpName=String(a.image || f.bmpName || DEFAULT_FOG);
    f.op=Math.max(0,Math.min(255,Number(a.opacity||160)));
    f.sx=Number(a.speedX||0.2); f.sy=Number(a.speedY||0);
    f.blend=String(a.blend||"normal"); f.fade=0;
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Fog:Disable",a=>{
    const f=S().fog; f.fade=Math.max(0,Number(a.fadeFrames||45)); f.on=false;
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Fog:Set",a=>{
    const f=S().fog;
    f.op=Math.max(0,Math.min(255,Number(a.opacity||f.op)));
    f.sx=Number(a.speedX||f.sx); f.sy=Number(a.speedY||f.sy);
    f.blend=String(a.blend||f.blend);
  });

  // Darken
  PluginManager.registerCommand("Weather_CoderainPlus","Darken:Enable",a=>{
    const d=S().darken; d.target=Math.max(0,Math.min(255,Number(a.opacity||120))); d.fade=Math.max(0,Number(a.fadeFrames||30));
  });
  PluginManager.registerCommand("Weather_CoderainPlus","Darken:Disable",a=>{
    const d=S().darken; d.target=0; d.fade=Math.max(0,Number(a.fadeFrames||30));
  });

  // Rain audio
  PluginManager.registerCommand("Weather_CoderainPlus","RainBGS:Enable",a=>{
    AudioManager.playBgs({name:String(a.name||"Rain"), volume:Number(a.volume||80), pitch:Number(a.pitch||100), pan:Number(a.pan||0)});
  });
  PluginManager.registerCommand("Weather_CoderainPlus","RainBGS:Disable",a=>{
    AudioManager.fadeOutBgs(Number(a.fadeSec||2));
  });
  PluginManager.registerCommand("Weather_CoderainPlus","RainSE:EnableLoop",a=>{
    const se=S().seLoop;
    se.on=true; se.name=String(a.name||"Water2");
    se.vol=Number(a.volume||60);
    se.pMin=Number(a.pitchMin||90); se.pMax=Number(a.pitchMax||110);
    se.iMin=Math.max(0.2,Number(a.intMin||1.2)); se.iMax=Math.max(se.iMin+0.1,Number(a.intMax||2.4));
    se.timer = Math.floor(se.iMin*60 + Math.random()*(se.iMax - se.iMin)*60);
  });
  PluginManager.registerCommand("Weather_CoderainPlus","RainSE:DisableLoop",()=>{
    const se=S().seLoop; se.on=false; se.timer=0;
  });

  // --- WEATHER: 'coderain' particles ---
  const _W_createBitmaps = Weather.prototype._createBitmaps;
  Weather.prototype._createBitmaps = function() {
    _W_createBitmaps.call(this);
    const w=WIDTH, h=LEN, bmp=new Bitmap(w,h);
    for (let y=0;y<h;y++){ const t=y/(h-1), a=Math.floor(40+150*(1-t));
      bmp.fillRect(0,y,w,1,`rgba(${COL.r},${COL.g},${COL.b},${a/255})`); }
    bmp.fillRect(0,6,w,2,`rgba(${HEAD.r},${HEAD.g},${HEAD.b},0.9)`);
    this._coderainBitmap=bmp;
  };
  const _W_addSprite = Weather.prototype._addSprite;
  Weather.prototype._addSprite = function(){ const s=_W_addSprite.call(this);
    if (this._type==="coderain"){ s.bitmap=this._coderainBitmap||this._rainBitmap; s.rotation=0; s.blendMode=BLEND; }
    return s; };
  const _W_updateSprite = Weather.prototype._updateSprite;
  Weather.prototype._updateSprite = function(s){ if (this._type!=="coderain"){ _W_updateSprite.call(this,s); return; }
    const p=Math.max(0,Math.min(9,this.power())); const h=Graphics.height;
    if (!s._born){ s.ax=Math.random()*Graphics.width; s.ay=Math.random()*(h+LEN)-LEN; s.opacity=0; s._born=true; }
    const vy=(SPEED_Y_9*(p/9))||1; s.ay+=vy; s.x=Math.floor(s.ax); s.y=Math.floor(s.ay); s.opacity+=24;
    if (s.y>h+LEN || s.opacity<=0) this._rebornCoderain(s); };
  Weather.prototype._rebornCoderain = function(s){ s.ax=Math.random()*Graphics.width; s.ay=-LEN - Math.random()*Graphics.height*0.25;
    s.opacity=64+Math.random()*128; s.rotation=0; s.bitmap=this._coderainBitmap||this._rainBitmap; s.blendMode=BLEND; };
  const _W_updateAllSprites = Weather.prototype._updateAllSprites;
  Weather.prototype._updateAllSprites = function(){ const max=this._type==="coderain"?Math.floor(this.power()*10):undefined;
    if (max!==undefined && this._sprites.length<max){ while(this._sprites.length<max) this._addSprite(); }
    _W_updateAllSprites.call(this); };

  // --- Spriteset_Map overlays (tile coderain + fog + darken) ---
  const _SM_createUpperLayer = Spriteset_Map.prototype.createUpperLayer;
  Spriteset_Map.prototype.createUpperLayer = function() {
    _SM_createUpperLayer.call(this);
    this._codeTile = new TilingSprite(null); this._codeTile.move(0,0,Graphics.width,Graphics.height); this._codeTile.alpha=0; this.addChild(this._codeTile);
    this._fogTs   = new TilingSprite(null); this._fogTs.move(0,0,Graphics.width,Graphics.height); this._fogTs.alpha=0; this.addChild(this._fogTs);
    const dark=new Sprite(new Bitmap(1,1)); dark.bitmap.fillRect(0,0,1,1,"#000"); dark.scale.x=Graphics.width; dark.scale.y=Graphics.height; dark.alpha=0;
    this._darkenSpr=dark; this.addChild(dark);
    this._missingLogDone = false;
  };

  const _SM_update = Spriteset_Map.prototype.update;
  Spriteset_Map.prototype.update = function() {
    _SM_update.call(this);
    const st=S();

    // helper to (re)load a tiling sprite image
    const reload = (ts, name) => {
      if (!name) return false;
      const want = "img/pictures/" + name + ".png";
      const have = ts.bitmap?._url || "";
      if (!have.endsWith(want)) {
        ts.bitmap = ImageManager.loadBitmap("img/pictures/", name);
      }
      return true;
    };

    // PNG coderain tile
    if (this._codeTile) {
      if (st.tile.on) reload(this._codeTile, st.tile.bmpName || DEFAULT_TILE);
      this._codeTile.origin.x += st.tile.sx;
      this._codeTile.origin.y += st.tile.sy;
      const tgt = st.tile.on ? (st.tile.op/255) : 0;
      if (st.tile.on) {
        this._codeTile.alpha += (tgt - this._codeTile.alpha)*0.15;
        this._codeTile.blendMode = BLENDS[st.tile.blend] || PIXI.BLEND_MODES.NORMAL;
      } else if (st.tile.fade>0) { this._codeTile.alpha -= 1/st.tile.fade; st.tile.fade--; } else { this._codeTile.alpha=0; }
      // warn once if missing
      if (st.tile.on && !st.tile.bmpName && !this._missingLogDone) { console.warn("Coderain PNG: no image name set. Using Default PNG Tile param or nothing."); this._missingLogDone=true; }
    }

    // Fog
    if (this._fogTs) {
      if (st.fog.on) reload(this._fogTs, st.fog.bmpName || DEFAULT_FOG);
      this._fogTs.origin.x += st.fog.sx; this._fogTs.origin.y += st.fog.sy;
      const tgt = st.fog.on ? (st.fog.op/255) : 0;
      if (st.fog.on) {
        this._fogTs.alpha += (tgt - this._fogTs.alpha)*0.15;
        this._fogTs.blendMode = BLENDS[st.fog.blend] || PIXI.BLEND_MODES.NORMAL;
      } else if (st.fog.fade>0) { this._fogTs.alpha -= 1/st.fog.fade; st.fog.fade--; } else { this._fogTs.alpha=0; }
    }

    // Darken
    if (this._darkenSpr) {
      const tgt = st.darken.target/255;
      if (st.darken.fade>0) { const diff=tgt-this._darkenSpr.alpha; this._darkenSpr.alpha += diff/st.darken.fade; st.darken.fade--; }
      else { this._darkenSpr.alpha = tgt; }
    }
  };

  // keep thunder & SE loop timing on Scene_Map (from v1.2)
  const _Scene_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _Scene_Map_update.call(this);
    const st=S();
    // Thunder bursts
    if (st.thunderOn) {
      const t=st.thunder;
      if (t.strikesLeft>0) {
        if (t.intraTimer>0) t.intraTimer--;
        if (t.intraTimer===0) {
          const power = Math.floor(t.pMin + Math.random()*(t.pMax - t.pMin));
          const frames = Math.floor(t.fMin + Math.random()*(t.fMax - t.fMin));
          $gameScreen.startFlash([255,255,255,power], frames);
          const vol = Math.floor(t.volMin + Math.random()*(t.volMax - t.volMin));
          const pit = Math.floor(t.pitchMin + Math.random()*(t.pitchMax - t.pitchMin));
          if (t.se) AudioManager.playSe({name:t.se, volume:vol, pitch:pit, pan:0});
          t.strikesLeft--;
          t.intraTimer = t.strikesLeft>0 ? Math.floor(t.interMin + Math.random()*(t.interMax - t.interMin)) : 0;
          if (t.strikesLeft===0) t.burstTimer = Math.floor(t.min*60 + Math.random()*(t.max - t.min)*60);
        }
      } else {
        if (t.burstTimer>0) t.burstTimer--;
        if (t.burstTimer===0) { t.strikesLeft = Math.floor(t.burstMin + Math.random()*(t.burstMax - t.burstMin + 1)); t.intraTimer=0; }
      }
    }
    // Rain SE loop
    if (st.seLoop.on) {
      if (st.seLoop.timer>0) st.seLoop.timer--;
      if (st.seLoop.timer===0) {
        const pitch = Math.floor(st.seLoop.pMin + Math.random()*(st.seLoop.pMax - st.seLoop.pMin));
        AudioManager.playSe({name:st.seLoop.name, volume:st.seLoop.vol, pitch:pitch, pan:0});
        st.seLoop.timer = Math.floor(st.seLoop.iMin*60 + Math.random()*(st.seLoop.iMax - st.seLoop.iMin)*60);
      }
    }
  };

  // reset state on new game
  const _DataManager_setupNewGame = DataManager.setupNewGame;
  DataManager.setupNewGame = function(){ _DataManager_setupNewGame.call(this); $gameSystem._coderainPlus = null; };

})();
