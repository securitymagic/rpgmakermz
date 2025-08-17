/*:
 * @target MZ
 * @plugindesc Cyber slot — reels, XOR on gold, SUB penalties, vibrance filter, rich audio. Background image support + adjustable reel layout. v2.12
 * @author ChatGPT
 *
 * @help
 * NEW (layout controls):
 *  - Reel Offset X / Y: nudge the whole 3‑reel group to line up with your background.
 *  - Reel Spacing: distance (px) between neighboring reels.
 *  - Reel Scale: scales the entire reel group (use e.g. 1.05 to enlarge slightly).
 *  - Reel Panel Pad / Panel Y Offset: adjust the dark panel behind the reels.
 *  - Frame Border Color / Thickness / Show Frames: style the neon borders.
 *
 * Usual tips: enable **Disable Menu Snapshot** to avoid the blurred overlay.
 *
 * @command OpenSlotMachine
 * @text Open Slot Machine
 *
 * @param spritesheet
 * @text Reel Spritesheet
 * @type file
 * @dir img/pictures/
 * @default Untitled
 *
 * @param frameSize
 * @type number
 * @default 144
 *
 * @param terminalTheme
 * @type boolean
 * @default true
 *
 * @param wildIndex
 * @type number
 * @min 0
 * @max 7
 * @default 0
 *
 * @param xorIndex
 * @type number
 * @min 0
 * @max 7
 * @default 7
 *
 * @param subIndex
 * @type number
 * @min 0
 * @max 7
 * @default 5
 *
 * @param jackpotIndex
 * @type number
 * @min 0
 * @max 7
 * @default 6
 *
 * @param symbolNames
 * @type text[]
 * @default["WILD","MAG","SHIELD","HACKED","BLANK","SUB","JACKPOT","XOR"]
 *
 * @param weights
 * @text Weights (8 numbers)
 * @type number[]
 * @default[12,14,10,8,18,6,2,6]
 *
 * @param twoOfKind
 * @type struct<SymbolMults>
 * @default {"WILD":"3","MAG":"2","SHIELD":"3","HACKED":"3","BLANK":"0","SUB":"-1","JACKPOT":"5","XOR":"0"}
 *
 * @param threeOfKind
 * @type struct<SymbolMults>
 * @default {"WILD":"10","MAG":"5","SHIELD":"6","HACKED":"7","BLANK":"0","SUB":"-2","JACKPOT":"50","XOR":"0"}
 *
 * @param xorTwoHex
 * @text XOR for 2×XOR (hex, 1–8 digits)
 * @type text
 * @default 0000FF00
 *
 * @param xorThreeHex
 * @text XOR for 3×XOR (hex, 1–8 digits)
 * @type text
 * @default 00FFFFFF
 *
 * @param xorTiming
 * @text XOR Timing
 * @type select
 * @option AFTER (default)
 * @value AFTER
 * @option BEFORE (flip first, then compute payouts/penalties)
 * @value BEFORE
 * @default AFTER
 *
 * @param betMin
 * @type number
 * @default 100
 *
 * @param betStep
 * @type number
 * @default 100
 *
 * @param betMax
 * @type number
 * @default 10000
 *
 * @param reelBackdropOpacity
 * @text Reel Backdrop Opacity (0-255)
 * @type number
 * @min 0
 * @max 255
 * @default 190
 *
 * @param spinMs
 * @text Spin Duration per Reel (ms)
 * @type number
 * @default 1200
 *
 * @param spinStaggerMs
 * @text Stagger Between Reels (ms)
 * @type number
 * @default 250
 *
 * @param spinCycles
 * @text Base Cycles Before Stop
 * @type number
 * @default 6
 *
 * @param reelFilterEnabled
 * @text Vibrance Filter Enabled
 * @type boolean
 * @default true
 *
 * @param reelBrightness
 * @text Reel Brightness (e.g., 1.10)
 * @type number
 * @default 1.10
 *
 * @param reelContrast
 * @text Reel Contrast (e.g., 1.10)
 * @type number
 * @default 1.10
 *
 * @param reelSaturation
 * @text Reel Saturation (e.g., 1.25)
 * @type number
 * @default 1.25
 *
 * @param drawReelsAboveWindows
 * @text Draw Reels Above Windows
 * @type boolean
 * @default false
 *
 * @param spinSeName
 * @text Spin SE Name (audio/se)
 * @type file
 * @dir audio/se/
 * @default Attack1
 *
 * @param spinSePitch
 * @text Spin SE Pitch Start (%)
 * @type number
 * @min 50
 * @max 200
 * @default 150
 *
 * @param spinSePitchMin
 * @text Spin SE Pitch Min (%)
 * @type number
 * @min 50
 * @max 200
 * @default 110
 *
 * @param spinSePitchStep
 * @text Spin SE Pitch Step per Tick (negative)
 * @type number
 * @min -50
 * @max 0
 * @default -2
 *
 * @param spinSePan
 * @text Spin SE Pan (-100..100)
 * @type number
 * @min -100
 * @max 100
 * @default -40
 *
 * @param spinSeVolume
 * @text Spin SE Volume (0..100)
 * @type number
 * @min 0
 * @max 100
 * @default 70
 *
 * @param spinSeInterval
 * @text Spin SE Interval (ms)
 * @type number
 * @min 40
 * @max 800
 * @default 110
 *
 * @param stopSeName
 * @text Reel Stop SE (audio/se)
 * @type file
 * @dir audio/se/
 * @default Cursor2
 *
 * @param stopSePitchStart
 * @text Stop SE Pitch Start (%)
 * @type number
 * @min 50
 * @max 200
 * @default 140
 *
 * @param stopSePitchStep
 * @text Stop SE Pitch Step per Reel
 * @type number
 * @min -50
 * @max 50
 * @default -10
 *
 * @param stopSePan
 * @text Stop SE Pan (-100..100)
 * @type number
 * @min -100
 * @max 100
 * @default -10
 *
 * @param stopSeVolume
 * @text Stop SE Volume (0..100)
 * @type number
 * @min 0
 * @max 100
 * @default 80
 *
 * @param finishSeName
 * @text Finish SE Name (audio/se)
 * @type file
 * @dir audio/se/
 * @default Coin
 *
 * @param finishSePitch
 * @text Finish SE Pitch (%)
 * @type number
 * @min 50
 * @max 200
 * @default 100
 *
 * @param finishSePan
 * @text Finish SE Pan (-100..100)
 * @type number
 * @min -100
 * @max 100
 * @default 0
 *
 * @param finishSeVolume
 * @text Finish SE Volume (0..100)
 * @type number
 * @min 0
 * @max 100
 * @default 90
 *
 * @param jackMeName
 * @text Jackpot Fanfare (audio/me)
 * @type file
 * @dir audio/me/
 * @default Fanfare1
 *
 * @param jackMePitch
 * @type number
 * @default 100
 *
 * @param jackMePan
 * @type number
 * @default 0
 *
 * @param jackMeVolume
 * @type number
 * @default 90
 *
 * @param subSeName
 * @text SUB Thunk (audio/se)
 * @type file
 * @dir audio/se/
 * @default Buzzer1
 *
 * @param subSePitch
 * @type number
 * @default 100
 *
 * @param subSePan
 * @type number
 * @default 0
 *
 * @param subSeVolume
 * @type number
 * @default 90
 *
 * @param xorSeName
 * @text XOR Glitch (audio/se)
 * @type file
 * @dir audio/se/
 * @default Evasion2
 *
 * @param xorSePitch
 * @type number
 * @default 150
 *
 * @param xorSePan
 * @type number
 * @default 0
 *
 * @param xorSeVolume
 * @type number
 * @default 90
 *
 * @param bgEnabled
 * @text Background Image Enabled
 * @type boolean
 * @default false
 *
 * @param bgPicture
 * @text Background Picture
 * @type file
 * @dir img/pictures/
 * @default 
 *
 * @param bgFit
 * @text Background Fit Mode
 * @type select
 * @option COVER
 * @option CONTAIN
 * @option STRETCH
 * @option CENTER
 * @option TILE
 * @default COVER
 *
 * @param bgOpacity
 * @text Background Opacity (0-255)
 * @type number
 * @min 0
 * @max 255
 * @default 255
 *
 * @param bgDim
 * @text Background Dim (0-255)
 * @type number
 * @min 0
 * @max 255
 * @default 40
 *
 * @param disableMenuBackground
 * @text Disable Menu Snapshot (no blurred overlay)
 * @type boolean
 * @default true
 *
 * @param reelOffsetX
 * @text Reel Offset X (px)
 * @type number
 * @default 0
 *
 * @param reelOffsetY
 * @text Reel Offset Y (px)
 * @type number
 * @default 0
 *
 * @param reelSpacing
 * @text Reel Spacing (px between reels)
 * @type number
 * @default 40
 *
 * @param reelScale
 * @text Reel Scale (e.g., 1.00 = 100%)
 * @type number
 * @decimals 2
 * @default 1.00
 *
 * @param reelPanelPad
 * @text Reel Panel Pad (px)
 * @type number
 * @default 32
 *
 * @param reelPanelYOffset
 * @text Reel Panel Y Offset (px)
 * @type number
 * @default -12
 *
 * @param frameBorderColor
 * @text Frame Border Color
 * @type text
 * @default #00ff88
 *
 * @param frameBorderThickness
 * @text Frame Border Thickness (px)
 * @type number
 * @default 2
 *
 * @param showFrames
 * @text Show Neon Frames
 * @type boolean
 * @default true
 */
 /*~struct~SymbolMults:
 * @param WILD
 * @type number
 * @default 3
 * @param MAG
 * @type number
 * @default 2
 * @param SHIELD
 * @type number
 * @default 3
 * @param HACKED
 * @type number
 * @default 3
 * @param BLANK
 * @type number
 * @default 0
 * @param SUB
 * @type number
 * @default -1
 * @param JACKPOT
 * @type number
 * @default 50
 * @param XOR
 * @type number
 * @default 0
 */
(() => {
  const PLUGIN_NAME = document.currentScript.src.split('/').pop().replace('.js','');
  const P = PluginManager.parameters(PLUGIN_NAME);
  const normalize = (s)=> String(s||'').replace(/^.*[\\/]/,'').replace(/\.(png|jpg|jpeg|ogg|m4a|wav|mp3)$/i,'');
  const SHEET  = normalize(P.spritesheet || 'Untitled');
  const FRAME  = Number(P.frameSize || 144);
  const USE_TERM = P.terminalTheme === 'true';

  const WILD = Number(P.wildIndex || 0);
  const XORI = Number(P.xorIndex || 7);
  const SUBI = Number(P.subIndex || 5);
  const JACK = Number(P.jackpotIndex || 6);
  const NAMES = JSON.parse(P.symbolNames || '[]');

  const WEIGHTS = (JSON.parse(P.weights || '[12,14,10,8,18,6,2,6]')).map(Number);
  const TWO = JSON.parse(P.twoOfKind || '{}');
  const THREE = JSON.parse(P.threeOfKind || '{}');
  const XOR_TWO = (parseInt(String(P.xorTwoHex||'0000FF00').replace(/^0x/i,''),16) >>> 0);
  const XOR_THREE = (parseInt(String(P.xorThreeHex||'00FFFFFF').replace(/^0x/i,''),16) >>> 0);
  const XOR_TIMING = String(P.xorTiming||'AFTER').toUpperCase();

  const BET_MIN=Number(P.betMin||100), BET_STEP=Number(P.betStep||100), BET_MAX=Number(P.betMax||10000);
  const REEL_BG_OPACITY = Number(P.reelBackdropOpacity||190);
  const SPIN_MS = Number(P.spinMs||1200);
  const STAG_MS = Number(P.spinStaggerMs||250);
  const SPIN_CYCLES = Number(P.spinCycles||6);

  const FILTER_ON = P.reelFilterEnabled === 'true';
  const BR = parseFloat(P.reelBrightness || '1.10');
  const CT = parseFloat(P.reelContrast   || '1.10');
  const ST = parseFloat(P.reelSaturation || '1.25');
  const REELS_ABOVE = P.drawReelsAboveWindows === 'true';

  // Background + layout
  const BG_ENABLED = P.bgEnabled === 'true';
  const BG_NAME = normalize(P.bgPicture || '');
  const BG_FIT = String(P.bgFit || 'COVER').toUpperCase();
  const BG_OPACITY = Number(P.bgOpacity || 255);
  const BG_DIM = Number(P.bgDim || 40);
  const DISABLE_MENU_BG = P.disableMenuBackground === 'true';

  const ROX = Number(P.reelOffsetX || 0);
  const ROY = Number(P.reelOffsetY || 0);
  const RSP = Number(P.reelSpacing || 40);
  const RSCALE = parseFloat(P.reelScale || '1.0');
  const PANEL_PAD = Number(P.reelPanelPad || 32);
  const PANEL_YOFF = Number(P.reelPanelYOffset || -12);

  const FRAME_COLOR = String(P.frameBorderColor || '#00ff88');
  const FRAME_THICK = Number(P.frameBorderThickness || 2);
  const SHOW_FRAMES = P.showFrames === 'true';

  PluginManager.registerCommand(PLUGIN_NAME, 'OpenSlotMachine', () => SceneManager.push(Scene_SlotMachine));

  function weightedChoice(weights){
    const sum = weights.reduce((a,b)=>a+b,0);
    let r = Math.random()*sum;
    for(let i=0;i<weights.length;i++){ if(r<weights[i]) return i; r -= weights[i]; }
    return weights.length-1;
  }
  const isWild = i => i===WILD;
  const same = (x,y)=> x===y || isWild(x) || isWild(y);
  const clampGold = (v)=>{
    const max = ($gameParty.maxGold && $gameParty.maxGold()) || 99999999;
    return Math.max(0, Math.min(max, v|0));
  };

  function playSe(obj){ if(!obj || !obj.name) return; AudioManager.playSe({ name: obj.name, volume: obj.volume||90, pitch: obj.pitch||100, pan: obj.pan||0 }); }
  function playMe(obj){ if(!obj || !obj.name) return; AudioManager.playMe({ name: obj.name, volume: obj.volume||90, pitch: obj.pitch||100, pan: obj.pan||0 }); }

  class Scene_SlotMachine extends Scene_MenuBase {
    createBackground(){
      if (DISABLE_MENU_BG) {
        this._backgroundSprite = new Sprite();
        this.addChild(this._backgroundSprite);
      } else {
        super.createBackground();
        this.setBackgroundOpacity(255);
      }
    }

    create(){
      super.create();
      this._bet = BET_MIN;
      this._spinning = false;
      this._spinSeTimer = null;
      this._spinSePitchNow = 150;

      this.createBackgroundLayered();
      this.createReelLayer();
      this.createReels();
      this.createResult();
      this.createHud();
      if (REELS_ABOVE) this.bringReelsToFront();
      this.refreshHud();
    }

    bringReelsToFront(){
      if (this._reelLayer && this._reelLayer.parent){
        this.removeChild(this._reelLayer);
        this.addChild(this._reelLayer);
      }
    }

    terminate(){ super.terminate(); this.stopSpinSe(); }

    createBackgroundLayered(){
      if (BG_ENABLED && BG_NAME){
        if (BG_FIT === 'TILE'){
          const bmp = ImageManager.loadPicture(BG_NAME);
          const tile = new TilingSprite(bmp);
          tile.move(0,0, Graphics.width, Graphics.height);
          tile.opacity = BG_OPACITY;
          this.addChildAt(tile, 0);
        } else {
          const sp = new Sprite();
          sp.bitmap = ImageManager.loadPicture(BG_NAME);
          sp.opacity = BG_OPACITY;
          sp.anchor.x = 0.5; sp.anchor.y = 0.5;
          sp.x = Graphics.width/2; sp.y = Graphics.height/2;
          const applyFit = ()=>{
            const bw = sp.bitmap.width, bh = sp.bitmap.height;
            if(bw<=0 || bh<=0) return;
            const sw = Graphics.width, sh = Graphics.height;
            let sx=1, sy=1;
            if (BG_FIT === 'COVER'){ const r = Math.max(sw/bw, sh/bh); sx=sy=r; }
            else if (BG_FIT === 'CONTAIN'){ const r = Math.min(sw/bw, sh/bh); sx=sy=r; }
            else if (BG_FIT === 'STRETCH'){ sx = sw/bw; sy = sh/bh; }
            else if (BG_FIT === 'CENTER'){ sx=sy=1; }
            sp.scale.set(sx, sy);
          };
          sp.bitmap.addLoadListener(applyFit);
          if (sp.bitmap.isReady()) applyFit();
          this.addChildAt(sp, 0);
        }
        if (BG_DIM > 0){
          const dim = new Sprite(new Bitmap(Graphics.width, Graphics.height));
          dim.bitmap.fillRect(0,0,Graphics.width,Graphics.height, 'rgba(0,0,0,'+(BG_DIM/255)+')');
          this.addChildAt(dim, 1);
        }
      } else {
        const base = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        base.bitmap.fillAll(USE_TERM ? '#000' : '#111');
        this.addChildAt(base, 0);
      }
      const label = new Sprite(new Bitmap(400, 28));
      label.x = 8; label.y = 8;
      label.bitmap.textColor = USE_TERM ? '#0f8' : '#fff';
      label.bitmap.drawText('CYBER SLOT v2.12', 0, 0, 400, 28, 'left');
      this.addChild(label);
    }

    createReelLayer(){
      this._reelLayer = new Sprite();
      this.addChild(this._reelLayer);
      this._reelLayer.scale.set(RSCALE, RSCALE);
    }

    createReels(){
      const totalW = FRAME*3 + RSP*2;
      const x0 = Math.floor((Graphics.width - totalW)/2) + ROX;
      const baseY = Math.floor((Graphics.height - FRAME)/2 - 40) + ROY;
      this._reelY0 = baseY;
      this._reels = [];

      const panelW = FRAME*3 + RSP*2 + PANEL_PAD*2;
      const panelH = FRAME + 24;
      const panel = new Sprite(new Bitmap(panelW, panelH));
      panel.x = x0 - PANEL_PAD;
      panel.y = baseY + PANEL_YOFF;
      panel.bitmap.fillRect(0,0,panel.bitmap.width,panel.bitmap.height, 'rgba(0,0,0,' + (REEL_BG_OPACITY/255) + ')');
      this._reelLayer.addChild(panel);

      for(let i=0;i<3;i++){
        const s = new Sprite_ReelScroll(SHEET, FRAME, 8, null);
        s.x = x0 + i*(FRAME+RSP);
        s.y = baseY;
        if (FILTER_ON && window.PIXI && PIXI.filters && PIXI.filters.ColorMatrixFilter){
          const f = new PIXI.filters.ColorMatrixFilter();
          f.brightness(isFinite(BR)?BR:1.0, false);
          f.contrast(isFinite(CT)?CT:1.0, true);
          const satDelta = (isFinite(ST)?ST:1.0) - 1.0;
          if (satDelta !== 0) f.saturate(satDelta, true);
          s.filters = [f];
        }
        this._reelLayer.addChild(s);
        this._reels.push(s);
      }

      if (SHOW_FRAMES){
        const frame = new Sprite(new Bitmap(Graphics.width, Graphics.height));
        const bmp = frame.bitmap;
        const col = FRAME_COLOR; const bw = Math.max(1, FRAME_THICK|0);
        for(let i=0;i<3;i++){
          const rx=this._reels[i].x-2, ry=this._reels[i].y-2;
          const rw=FRAME+4, rh=FRAME+4;
          bmp.fillRect(rx, ry, rw, bw, col);
          bmp.fillRect(rx, ry+rh-bw, rw, bw, col);
          bmp.fillRect(rx, ry, bw, rh, col);
          bmp.fillRect(rx+rw-bw, ry, bw, rh, col);
        }
        this._reelLayer.addChild(frame);
      }

      this._reels.forEach(r=>r.setInstant(Math.floor(Math.random()*8)));
    }

    createResult(){
      const resultH = 60;
      const rect = new Rectangle(20, Graphics.height - resultH - 12, Graphics.width - 40, resultH);
      this._result = new Window_SlotResult(rect);
      this._result.opacity = 210;
      this.addWindow(this._result);
    }

    createHud(){
      const hudH = 136;
      const margin = 12;
      const hudY = Math.min((this._reelY0||80)+FRAME+24, this._result.y - hudH - margin);
      const rect = new Rectangle(20, hudY, Graphics.width-40, hudH);
      this._hud = new Window_SlotHud(rect);
      this._hud.opacity = 210;
      this._hud.setHandler('spin',   this.commandSpin.bind(this));
      this._hud.setHandler('betUp',  this.commandBetUp.bind(this));
      this._hud.setHandler('betDn',  this.commandBetDn.bind(this));
      this._hud.setHandler('cancel', this.popScene.bind(this));
      this.addWindow(this._hud);
      this._hud.select(0);
      this._hud.activate();
    }

    refreshHud(){ if(this._hud){ this._hud.setBet(this._bet); this._hud.setGold($gameParty.gold()); } }

    // Audio helpers
    startSpinSe(){
      this.stopSpinSe();
      this._spinSePitchNow = 150;
      const play = () => {
        const pitch = Math.max(110, Math.min(200, this._spinSePitchNow|0));
        AudioManager.playSe({ name: 'Attack1', volume: 70, pitch, pan: -40 });
        this._spinSePitchNow = Math.max(110, this._spinSePitchNow - 2);
      };
      play();
      this._spinSeTimer = setInterval(play, 110);
    }
    stopSpinSe(){ if (this._spinSeTimer){ clearInterval(this._spinSeTimer); this._spinSeTimer=null; } }
    playFinishSe(){ AudioManager.playSe({ name:'Coin', volume:90, pitch:100, pan:0 }); }
    playStopSe(index){
      AudioManager.playSe({ name:'Cursor2', volume:80, pitch:140 + (-10*index), pan:-10 });
    }

    commandBetUp(){ if(this._spinning) return; this._bet = Math.min(BET_MAX, this._bet+BET_STEP); this.refreshHud(); this._hud.activate(); }
    commandBetDn(){ if(this._spinning) return; this._bet = Math.max(BET_MIN, this._bet-BET_STEP); this.refreshHud(); this._hud.activate(); }

    commandSpin(){
      if(this._spinning) return;
      if($gameParty.gold() < this._bet){ SoundManager.playBuzzer(); this._result.setText(`Not enough gold for ${this._bet}g.`); return; }
      const goldStart = $gameParty.gold();
      $gameParty.loseGold(this._bet);
      this.refreshHud();

      this._spinning = true;
      this._hud.deactivate();
      this._result.setText('');
      this.startSpinSe();

      const res = [weightedChoice(WEIGHTS), weightedChoice(WEIGHTS), weightedChoice(WEIGHTS)];
      const xorCount = res.filter(i=>i===XORI).length;
      const subCount = res.filter(i=>i===SUBI).length;

      const stopPromises = [];
      for(let i=0;i<3;i++){
        const delay = i * STAG_MS;
        const spinTime = SPIN_MS + i*150;
        const cycles = SPIN_CYCLES + i;
        stopPromises.push(new Promise(resolve => {
          setTimeout(() => {
            this._reels[i].spinTo(res[i], spinTime, cycles).then(()=>{ this.playStopSe(i); resolve(); });
          }, delay);
        }));
      }

      Promise.all(stopPromises).then(()=>{
        this.stopSpinSe();
        this.playFinishSe();

        let xorDelta = 0;
        if (xorCount >= 2 && XOR_TIMING === 'BEFORE') { xorDelta = this.applyXor(xorCount); }
        const baseDelta = this.basePayout(res, this._bet);
        if(baseDelta !== 0){ if(baseDelta>0) $gameParty.gainGold(baseDelta); else $gameParty.loseGold(-baseDelta); }
        const subPenalty = - this._bet * subCount;
        if(subPenalty !== 0){ $gameParty.loseGold(-subPenalty); AudioManager.playSe({name:'Buzzer1',volume:90,pitch:100,pan:0}); }
        if (xorCount >= 2 && XOR_TIMING !== 'BEFORE') { xorDelta = this.applyXor(xorCount); AudioManager.playSe({name:'Evasion2',volume:90,pitch:150,pan:0}); }
        if (this.isJackpot(res)) { AudioManager.playMe({name:'Fanfare1',volume:90,pitch:100,pan:0}); }

        const finalGold = $gameParty.gold();
        const netDelta = finalGold - goldStart;
        const names = res.map(i=>`${NAMES[i]||'#'+i}`).join(' | ');
        const parts = [ `Net: ${netDelta>=0?'+':''}${netDelta}g` ];
        if (subCount>0) parts.push(`SUB×${subCount}:${subPenalty}g`);
        if (xorCount>=2) parts.push(`XOR:${xorDelta>=0?'+':''}${xorDelta}g`);
        this._result.setText(`Result: [ ${names} ] → ${parts.join('  ')}   Gold: ${finalGold}g`);

        this._spinning = false;
        this.refreshHud();
        this._hud.activate(); this._hud.select(0);
      });
    }

    applyXor(xorCount){
      const key = (xorCount===3 ? XOR_THREE : XOR_TWO) >>> 0;
      const prev = $gameParty.gold() >>> 0;
      const next = clampGold((prev ^ key) >>> 0);
      const delta = (next|0) - (prev|0);
      if(delta >= 0) $gameParty.gainGold(delta); else $gameParty.loseGold(-delta);
      return delta;
    }

    isJackpot(arr){
      const [a,b,c]=arr;
      if(same(a,b) && same(b,c)){
        let key = [a,b,c].find(i=>!isWild(i)); if(key==null) key=WILD;
        return key === JACK;
      }
      return false;
    }

    basePayout(arr, bet){
      const [a,b,c]=arr;
      if(same(a,b) && same(b,c)){
        let key = [a,b,c].find(i=>!isWild(i)); if(key==null) key=WILD;
        let mult = Number(THREE[(NAMES[key]||'').toUpperCase()] || THREE[NAMES[key]] || THREE[key] || 0);
        const wilds = [a,b,c].filter(isWild).length; if(wilds>0) mult += 1;
        return Math.round(bet * mult);
      }
      const leftPair  = same(a,b) ? [a,b] : null;
      const rightPair = same(b,c) ? [b,c] : null;
      const pair = leftPair || rightPair;
      if(pair){
        const sym = pair.find(i=>!isWild(i)) ?? WILD;
        let mult = Number(TWO[(NAMES[sym]||'').toUpperCase()] || TWO[NAMES[sym]] || TWO[sym] || 0);
        const wilds = pair.filter(isWild).length;
        if(mult > 0 && wilds > 0) mult += 1;
        return Math.round(bet * mult);
      }
      return 0;
    }

    update(){
      super.update();
      if(!this._spinning && this._hud){
        if(Input.isTriggered('ok')) { this._hud.callHandler('spin'); }
        if(Input.isTriggered('pageup') || Input.isTriggered('q')) { this._hud.callHandler('betUp'); }
        if(Input.isTriggered('pagedown') || Input.isTriggered('w')) { this._hud.callHandler('betDn'); }
        if(Input.isTriggered('cancel')) { this._hud.callHandler('cancel'); }
      }
    }
  }

  class Window_SlotHud extends Window_Command {
    initialize(rect){ super.initialize(rect); this._bet=BET_MIN; this._gold=0; this.refresh(); }
    makeCommandList(){ this.addCommand('Spin','spin'); this.addCommand('Bet +','betUp'); this.addCommand('Bet -','betDn'); this.addCommand('Exit','cancel'); }
    maxCols(){ return 4; }
    itemHeight(){ return 28; }
    align(){ return 'center'; }
    setBet(v){ this._bet=v; this.refresh(); }
    setGold(v){ this._gold=v; this.refresh(); }
    refresh(){
      super.refresh();
      const r=this.innerRect;
      const cmdH = this.itemHeight();
      const hintY = cmdH + 6;
      const statusY = r.height - this.lineHeight();
      this.changeTextColor(USE_TERM?'#00ff88':'#ffffff');
      this.drawText('Z/Enter: Spin   Q/W: Bet±   Esc: Exit', 0, hintY, r.width, 'center');
      this.drawText(`Bet: ${this._bet}g    Gold: ${this._gold}g`, 0, statusY, r.width, 'center');
    }
  }

  class Window_SlotResult extends Window_Base {
    initialize(rect){ super.initialize(rect); this._text=''; this.setBackgroundType(2); }
    lineHeight(){ return 26; }
    setText(s){ this._text = String(s||''); this.refresh(); }
    refresh(){
      this.contents.clear();
      this.contents.fontSize = 20;
      this.changeTextColor(USE_TERM?'#00ff88':'#ffffff');
      this.drawText(this._text, 4, 10, this.innerWidth-8);
    }
  }

  class Sprite_ReelScroll extends Sprite {
    constructor(sheetName, frame, symbolCount, debugCb){
      super(new Bitmap(frame, frame));
      this._frameSize = frame;
      this._sheetName = sheetName;
      this._symbols = symbolCount;
      this._debug = typeof debugCb === 'function' ? debugCb : ()=>{};

      this._current = 0;
      this._scrollY = 0;
      this._targetY = 0;
      this._spinning = false;
      this._framesTotal = 0;
      this._framesLeft = 0;
      this._resolve = null;

      this.bitmap.fillRect(0,0,frame,frame,'#000');

      this._sheet = ImageManager.loadPicture(this._sheetName);
      this._sheet.addLoadListener(()=>{ this._buildTape(); this._redraw(); });
      if (this._sheet.isReady()) { this._buildTape(); this._redraw(); }
    }

    _buildTape(){
      const f = this._frameSize;
      const s = this._symbols;
      const REPEAT = 6;
      this._tapeH = f * s * REPEAT;
      this._tape = new Bitmap(f, this._tapeH);
      this._tape.fillRect(0,0,f,this._tapeH,'#000');
      for(let r=0;r<REPEAT;r++){
        for(let i=0;i<s;i++){
          const sx = i * f, sy = 0;
          const dy = (r*s + i) * f;
          this._tape.blt(this._sheet, sx, sy, f, f, 0, dy);
        }
      }
      this._scrollY = (this._current % s) * f;
    }

    setInstant(index){
      this._current = index % this._symbols;
      this._scrollY = this._current * this._frameSize;
      this._redraw();
    }

    setSymbol(index){ this.setInstant(index); }

    spinTo(targetIndex, durationMs, cycles=6){
      if(!this._tape){ this.setInstant(targetIndex); return Promise.resolve(); }
      const f = this._frameSize, s=this._symbols;
      const startIndex = Math.round(this._scrollY / f) % s;
      const deltaIndex = ( (targetIndex - startIndex) + s ) % s;
      const distancePx = (cycles * s + deltaIndex) * f;
      this._targetY = this._scrollY + distancePx;
      this._framesTotal = Math.max(1, Math.round((durationMs/1000) * 60));
      this._framesLeft = this._framesTotal;
      this._spinning = true;
      return new Promise(resolve => { this._resolve = resolve; });
    }

    update(){
      super.update();
      if(!this._spinning) return;
      const t = (this._framesTotal - this._framesLeft) / this._framesTotal;
      const ease = 1 - Math.pow(1 - t, 2);
      const pos = this._scrollY + (this._targetY - this._scrollY) * ease;
      this._drawAt(pos);
      this._framesLeft--;
      if(this._framesLeft <= 0){
        this._scrollY = this._targetY;
        this._current = (Math.round(this._scrollY / this._frameSize) % this._symbols + this._symbols) % this._symbols;
        this._redraw();
        this._spinning = false;
        if(this._resolve){ const r=this._resolve; this._resolve=null; r(); }
      }
    }

    _drawAt(scrollY){
      if(!this._tape) return;
      const f = this._frameSize;
      const h = this._tapeH;
      let sy = Math.floor(scrollY % h); if(sy<0) sy += h;
      const d = this.bitmap;
      d.clear();
      d.fillRect(0,0,f,f,'#000');
      const first = Math.min(f, h - sy);
      d.blt(this._tape, 0, sy, f, first, 0, 0);
      if(first < f){
        const rest = f - first;
        d.blt(this._tape, 0, 0, f, rest, 0, first);
      }
    }

    _redraw(){ this._drawAt(this._scrollY); }
    symbol(){ return this._current; }
  }

  window.Scene_SlotMachine = Scene_SlotMachine;
})();