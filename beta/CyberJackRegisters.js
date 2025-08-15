/*:
 * @target MZ
 * @plugindesc v1.4 CyberJack Registers — blackjack-like minigame (ADD/SUB/XOR/AND/OR) + betting. Frameless bet & action bars.
 * @author You
 *
 * @help CyberJackRegisters.js
 * - Build ACC close to Target without exceeding it (bust).
 * - Cards are immediate ops with a value: ADD v, SUB v, XOR v, AND v, OR v.
 * - First Hit places Bet; Win pays Bet * PayoutMultiplier; Push refunds Bet if enabled.
 * - After a round, a modal asks: Play Again / Quit (~2s delay or press OK). Result is highlighted in the log.
 *
 * Plugin Command → Start CyberJack
 *
 * @param HitBonusStep
 * @text Hit Bonus per Hit
 * @type number
 * @decimals 2
 * @min 0
 * @default 0.10
 *
  * @param WinSEName
 * @text Win SFX (normal)
 * @type file
 * @dir audio/se/
 * @default Coin
 *
 * @param BigWinSEName
 * @text Win SFX (big win)
 * @type file
 * @dir audio/se/
 * @default Applause1
 *
 * @param BigWinThreshold
 * @text Big Win Threshold (g)
 * @type number
 * @min 0
 * @default 500
 *
 * @param WinFlashColor
 * @text Win Flash Color (r,g,b)
 * @type string
 * @default 255,255,128
 *
 * @param WinFlashDuration
 * @text Win Flash Duration (frames)
 * @type number
 * @min 0
 * @default 45
 *
 * @param BigWinFlashColor
 * @text Big Win Flash Color (r,g,b)
 * @type string
 * @default 255,192,0
 *
 * @param BigWinFlashDuration
 * @text Big Win Flash Duration (frames)
 * @type number
 * @min 0
 * @default 75
 *
 * @param WinShakePower
 * @text Win Shake Power
 * @type number
 * @min 0
 * @default 3
 *
 * @param WinShakeSpeed
 * @text Win Shake Speed
 * @type number
 * @min 0
 * @default 6
 *
 * @param WinShakeDuration
 * @text Win Shake Duration (frames)
 * @type number
 * @min 0
 * @default 30
 *
 * @param BigWinShakePower
 * @text Big Win Shake Power
 * @type number
 * @min 0
 * @default 6
 *
 * @param BigWinShakeSpeed
 * @text Big Win Shake Speed
 * @type number
 * @min 0
 * @default 8
 *
 * @param BigWinShakeDuration
 * @text Big Win Shake Duration (frames)
 * @type number
 * @min 0
 * @default 45
 * @param TargetValue @type number @min 1 @max 255 @default 33
 * @param UseHexUI @type boolean @on Hex @off Decimal @default true
 * @param DealerStand @type number @min 5 @max 250 @default 17
 * @param AccWidth @type number @min 200 @max 1200 @default 640
 * @param DeckSeed @type number @min 0 @default 0
 * @param RewardSwitchWin @type switch @default 0
 * @param RewardSwitchLose @type switch @default 0
 * @param RewardVarMargin @type variable @default 0
 * @param PayoutMultiplier @type number @decimals 2 @min 0 @default 2.00
 * @param RefundOnPush @type boolean @on true @off false @default true
 * @param BetMin @type number @min 0 @default 10
 * @param BetMax @type number @min 0 @default 1000
 * @param BetStep @type number @min 1 @default 10
 * @param DefaultBet @type number @min 0 @default 50
 *
 * @command Start
 * @text Start CyberJack
 * @desc Open the CyberJack minigame scene.
 */

var Imported = Imported || {}; Imported.CyberJackRegisters = true;
(function(){"use strict";
const PLUGIN_NAME="CyberJackRegisters";
const P=PluginManager.parameters(PLUGIN_NAME);
const P_WinSEName          = String(P["WinSEName"] || "Coin");
const P_BigWinSEName       = String(P["BigWinSEName"] || "Applause1");
const P_BigWinThreshold    = Number(P["BigWinThreshold"] || 500);

function parseRgb(str, fallback) {
  try {
    const parts = String(str||"").split(",").map(n => Number(n.trim()));
    if (parts.length >= 3 && parts.every(n => !isNaN(n))) return [parts[0], parts[1], parts[2]];
  } catch(e) {}
  return fallback;
}
const P_WinFlashColor      = parseRgb(P["WinFlashColor"], [255,255,128]);
const P_WinFlashDuration   = Number(P["WinFlashDuration"] || 45);
const P_BigWinFlashColor   = parseRgb(P["BigWinFlashColor"], [255,192,0]);
const P_BigWinFlashDuration= Number(P["BigWinFlashDuration"] || 75);

const P_WinShakePower      = Number(P["WinShakePower"] || 3);
const P_WinShakeSpeed      = Number(P["WinShakeSpeed"] || 6);
const P_WinShakeDuration   = Number(P["WinShakeDuration"] || 30);

const P_BigWinShakePower   = Number(P["BigWinShakePower"] || 6);
const P_BigWinShakeSpeed   = Number(P["BigWinShakeSpeed"] || 8);
const P_BigWinShakeDuration= Number(P["BigWinShakeDuration"] || 45);

const P_Target=Number(P.TargetValue||33);
const P_UseHex=P.UseHexUI==="true";
const P_DealerStand=Number(P.DealerStand||17);
const P_AccWidth=Number(P.AccWidth||640);
const P_Seed=Number(P.DeckSeed||0);
const P_SwWin=Number(P.RewardSwitchWin||0);
const P_SwLose=Number(P.RewardSwitchLose||0);
const P_VarMargin=Number(P.RewardVarMargin||0);
const P_PayoutMult=Number(P.PayoutMultiplier||2.00);
const P_HitBonusStep = Number(P.HitBonusStep || 0.10); // +x per Hit (added to P_PayoutMult)
const P_RefundPush=(P.RefundOnPush==="true");
const P_BetMin=Number(P.BetMin||10);
const P_BetMax=Number(P.BetMax||1000);
const P_BetStep=Number(P.BetStep||10);
const P_DefaultBet=Number(P.DefaultBet||50);

function seededRandomFactory(seed){let x=seed||((Math.random()*0xffffffff)>>>0);return function(){x^=x<<13;x^=x>>>17;x^=x<<5;return ((x>>>0)/0xffffffff);}}
function choice(a,r){return a[Math.floor(r()*a.length)]}
function hex(n){return "0x"+(n>>>0).toString(16).toUpperCase()}
function fmt(n){return P_UseHex?hex(n&0xFF):String(n&0xFF)}

function playWinEffects(pay) {
  const big = pay >= P_BigWinThreshold;

  // SFX
  const seName = big ? P_BigWinSEName : P_WinSEName;
  if (seName) {
    AudioManager.playSe({ name: seName, volume: 90, pitch: 100, pan: 0 });
  }

  // Flash
const color   = big ? P_BigWinFlashColor : P_WinFlashColor; // [r,g,b]
const frames  = big ? P_BigWinFlashDuration : P_WinFlashDuration;
const alpha   = 255; // 255 = fully opaque tint; 160 can be too subtle on dark bg
$gameScreen.startFlash([color[0], color[1], color[2], alpha], frames);

  // Shake
  if (big) {
    $gameScreen.startShake(P_BigWinShakePower, P_BigWinShakeSpeed, P_BigWinShakeDuration);
  } else {
    $gameScreen.startShake(P_WinShakePower, P_WinShakeSpeed, P_WinShakeDuration);
  }
}

function CyberVM(target){this.target=target;this.acc=0;this.bust=false;this.opsLog=[]}
CyberVM.prototype.apply=function(tok){
  if(this.bust)return "BUST";

  const v=(tok.val!=null)?(tok.val&0xFF):0; let s="";
  if(tok.kind==="ADD"){const a=this.acc; this.acc=(this.acc+v)>>>0; s=`ADD ACC(${fmt(a)}) + ${fmt(v)} => ${fmt(this.acc)}`;}
  else if(tok.kind==="SUB"){const a=this.acc; this.acc=(this.acc-v)>>>0; s=`SUB ACC(${fmt(a)}) - ${fmt(v)} => ${fmt(this.acc)}`;}
  else if(tok.kind==="XOR"){const a=this.acc; this.acc=(this.acc^v)>>>0; s=`XOR ACC(${fmt(a)}) ^ ${fmt(v)} => ${fmt(this.acc)}`;}
  else if(tok.kind==="AND"){const a=this.acc; this.acc=(this.acc&v)>>>0; s=`AND ACC(${fmt(a)}) & ${fmt(v)} => ${fmt(this.acc)}`;}
  else if(tok.kind==="OR"){const a=this.acc; this.acc=(this.acc|v)>>>0; s=`OR ACC(${fmt(a)}) | ${fmt(v)} => ${fmt(this.acc)}`;}
  else if (tok.kind === "POP") {this.bust = true;s = "POP => INSTANT BUST";this.opsLog.push(s);return s;}
  this.opsLog.push(s); if(this.acc>this.target)this.bust=true; return s;
};

function CyberDeck(rnd){this.rnd=rnd||Math.random;this.cards=[];this.build();this.shuffle()}
CyberDeck.prototype.build=function(){
  this.cards=[]; const values=[1,2,3,4,5,6,7,8,9,10,0xA,0xF,0x10,0x11,0x13];
  const ops=["ADD","SUB","XOR","AND","OR"]; const weights={ADD:8,SUB:6,XOR:4,AND:4,OR:4};
  for(let k of ops){for(let i=0;i<weights[k];i++){const v=choice(values,this.rnd); this.cards.push({kind:k,val:v,label:(P_UseHex?hex(v):String(v))});}}
  // POP (rare): no value; drawing it immediately busts the drawer
  // Tweak count to make it rarer/common: 1–2 is rare, 3–4 is spicy
  for (var p = 0; p < 2; p++) {
    this.cards.push({ kind: "POP", val: null, label: "POP" });
  }
};
CyberDeck.prototype.shuffle=function(){for(let i=this.cards.length-1;i>0;i--){const j=Math.floor(this.rnd()*(i+1)); const t=this.cards[i]; this.cards[i]=this.cards[j]; this.cards[j]=t;}};
CyberDeck.prototype.draw=function(){return this.cards.length?this.cards.pop():null};

// Replay modal
function Window_CJReplay(x,y,w,h){this.initialize.apply(this,arguments)}
Window_CJReplay.prototype=Object.create(Window_Command.prototype);
Window_CJReplay.prototype.constructor=Window_CJReplay;
Window_CJReplay.prototype.initialize=function(x,y,w,h){Window_Command.prototype.initialize.call(this,new Rectangle(x,y,w,h))};
Window_CJReplay.prototype.makeCommandList=function(){this.addCommand("Play Again","yes"); this.addCommand("Quit","no")};

// Status
function Window_CJStatus(x,y,w,h){this.initialize.apply(this,arguments)}
Window_CJStatus.prototype=Object.create(Window_Base.prototype);
Window_CJStatus.prototype.constructor=Window_CJStatus;
Window_CJStatus.prototype.initialize=function(x,y,w,h){Window_Base.prototype.initialize.call(this,new Rectangle(x,y,w,h)); this._state={}; this.refresh()};
Window_CJStatus.prototype.setState=function(s){this._state=s||{}; this.refresh()};
Window_CJStatus.prototype.refresh=function(){
  this.contents.clear(); const s=this._state||{}; const lh=this.lineHeight();
  this.changeTextColor(ColorManager.systemColor()); this.drawText("TARGET",0,0,this.contentsWidth(),"left"); this.resetTextColor();
  this.drawText(P_UseHex?hex((s.target||0)&0xFF):String(s.target||0),160,0,this.contentsWidth()-160,"left");
  this.changeTextColor(ColorManager.systemColor()); this.drawText("PLAYER ACC",0,lh,this.contentsWidth(),"left"); this.resetTextColor();
  const txtP=(P_UseHex?hex((s.accP||0)&0xFF):String(s.accP||0))+(s.bustP?" (BUST)":""); this.drawText(txtP,160,lh,this.contentsWidth()-160,"left");
  this.changeTextColor(ColorManager.systemColor()); this.drawText("DEALER ACC",0,lh*2,this.contentsWidth(),"left"); this.resetTextColor();
  const txtD=(P_UseHex?hex((s.accD||0)&0xFF):String(s.accD||0))+(s.bustD?" (BUST)":""); this.drawText(txtD,160,lh*2,this.contentsWidth()-160,"left");
  this.changeTextColor(ColorManager.systemColor()); this.drawText("STACK (top->)",0,lh*3,this.contentsWidth(),"left"); this.resetTextColor();
  this.drawText("",160,lh*3,this.contentsWidth()-160,"left");
};

// --- Non-scrolling play log: always draws the last FEED_LINES lines ---
function Window_CJLog(x, y, w, h) { this.initialize.apply(this, arguments); }
Window_CJLog.prototype = Object.create(Window_Base.prototype);
Window_CJLog.prototype.constructor = Window_CJLog;

Window_CJLog.prototype.initialize = function(x, y, w, h) {
  Window_Base.prototype.initialize.call(this, new Rectangle(x, y, w, h));
  this._lines = [];
  this.refresh();
};

// How many lines to keep visible (adjust if you want)
Window_CJLog.prototype.FEED_LINES = 5;

Window_CJLog.prototype.setLines = function(lines) {
  // Keep a larger history if you like, but draw only the tail.
  this._lines = lines.slice(-200);
  this.refresh();
};

Window_CJLog.prototype.refresh = function() {
  this.contents.clear();
  const start = Math.max(0, this._lines.length - this.FEED_LINES);
  const lh = this.lineHeight();
  let y = 0;
  for (let i = start; i < this._lines.length; i++) {
    this.drawTextEx(this._lines[i] || "", 5, y, this.contentsWidth() - 12);
    y += lh;
  }
};

Window_CJLog.prototype.updateArrows = function(){
  if (this._downArrowSprite){
    this._downArrowSprite.visible = false;
    this._upArrowSprite.visible = false;
  }
};
// Frameless horizontal command strips (look like buttons but are windows)
function Window_CJFlat(rect){this.initialize.apply(this,arguments)}
Window_CJFlat.prototype=Object.create(Window_HorzCommand.prototype);
Window_CJFlat.prototype.constructor=Window_CJFlat;
Window_CJFlat.prototype.initialize=function(rect){
  Window_HorzCommand.prototype.initialize.call(this,rect);
  if(this.setBackgroundType) this.setBackgroundType(2); this.opacity=0; this.backOpacity=0;
};
Window_CJFlat.prototype.itemRect=function(i){
  const r=Window_HorzCommand.prototype.itemRect.call(this,i);
  r.width=Math.floor((this.width-this.padding*2)/this.maxCols())-8;
  r.x=this.padding+i*(r.width+8);
  r.height=this.lineHeight()+10;
  return r;
};
// Bet
function Window_CJBetFlat(rect){this.initialize.apply(this,arguments)}
Window_CJBetFlat.prototype=Object.create(Window_CJFlat.prototype);
Window_CJBetFlat.prototype.constructor=Window_CJBetFlat;
Window_CJBetFlat.prototype.maxCols=function(){return 4};
Window_CJBetFlat.prototype.makeCommandList=function(){this.addCommand("Min","betmin"); this.addCommand("-","betdec"); this.addCommand("+","betinc"); this.addCommand("Max","betmax")};
// Bottom actions
function Window_CJActions(rect){this.initialize.apply(this,arguments)}
Window_CJActions.prototype=Object.create(Window_CJFlat.prototype);
Window_CJActions.prototype.constructor=Window_CJActions;
Window_CJActions.prototype.maxCols=function(){return 4};
Window_CJActions.prototype.makeCommandList=function(){this.addCommand("Hit","hit"); this.addCommand("Stand","stand"); this.addCommand("Reset","reset"); this.addCommand("Quit","quit")};

function Scene_CyberJack(){this.initialize.apply(this,arguments)}
Scene_CyberJack.prototype=Object.create(Scene_Base.prototype);
Scene_CyberJack.prototype.constructor=Scene_CyberJack;
Scene_CyberJack.prototype.prepare=function(o){
  this._target=o.target||P_Target; this._dealerStand=o.dealerStand||P_DealerStand;
  this._swWin=o.swWin||P_SwWin; this._swLose=o.swLose||P_SwLose; this._varMargin=o.varMargin||P_VarMargin;
  const r=(P_Seed>0)?seededRandomFactory(P_Seed):Math.random; this._rnd=(typeof r==="function")?r:Math.random;
  this._bet=Math.max(P_BetMin,Math.min(P_BetMax,P_DefaultBet)); this._charged=false;
};
Scene_CyberJack.prototype.create=function(){
  Scene_Base.prototype.create.call(this);
  this.createBackground(); this.createWindowLayer();
  // Top banner
  this.createHelpWindow(); this._helpWindow.setText(this.helpText());

this._flashOverlay = new ScreenSprite();   // built-in full-screen flash sprite
this.addChild(this._flashOverlay);         // sits above background; below windows by default

  const bw=Math.min(Graphics.boxWidth-48,640), bh=60;
  const bx=Math.floor((Graphics.boxWidth-bw)/2), by=this._helpWindow.y+this._helpWindow.height+8;
  this._betFlat=new Window_CJBetFlat(new Rectangle(bx,by,bw,bh));
  this._betFlat.setHandler("betmin",()=>{this.onBetMin(); this._betFlat.activate();});
  this._betFlat.setHandler("betdec",()=>{this.onBetDec(); this._betFlat.activate();});
  this._betFlat.setHandler("betinc",()=>{this.onBetInc(); this._betFlat.activate();});
  this._betFlat.setHandler("betmax",()=>{this.onBetMax(); this._betFlat.activate();});
  this.addWindow(this._betFlat);
  // Status
  const swx=0, swy=this._betFlat.y+this._betFlat.height+8, sww=Math.min(P_AccWidth,Graphics.boxWidth), swh=180;
  this._statusWindow=new Window_CJStatus(swx,swy,sww,swh); this.addWindow(this._statusWindow);
  // Log
  const lwy=this._statusWindow.y+this._statusWindow.height+8, lwh=Graphics.boxHeight-lwy-72;
  this._logWindow=new Window_CJLog(0,lwy,Graphics.boxWidth,lwh); this.addWindow(this._logWindow);
  // Bottom actions as a frameless bar
  const aw=Math.min(Graphics.boxWidth-24,720), ah=64;
  const ax=Math.floor((Graphics.boxWidth-aw)/2), ay=Graphics.boxHeight-ah-6;
  this._actions=new Window_CJActions(new Rectangle(ax,ay,aw,ah));
  this._actions.setHandler("hit",()=>this.onHit());
  this._actions.setHandler("stand",()=>this.onStand());
  this._actions.setHandler("reset",()=>this.onReset());
  this._actions.setHandler("quit",()=>this.popScene());
  this.addWindow(this._actions); this._actions.select(0); this._actions.activate();
  // Replay
  this.createReplayWindow();
  // Flash overlay ON TOP (do this once, here)
if (!this._flashOverlay) this._flashOverlay = new ScreenSprite();
if (this._flashOverlay.parent) this._flashOverlay.parent.removeChild(this._flashOverlay);
this.addChild(this._flashOverlay);
  // State
  this.resetGame();
};
Scene_CyberJack.prototype.createBackground=function(){const bmp=new Bitmap(Graphics.width,Graphics.height); bmp.fillRect(0,0,Graphics.width,Graphics.height,"#000"); this._backgroundSprite=new Sprite(bmp); this.addChild(this._backgroundSprite)};
Scene_CyberJack.prototype.createHelpWindow=function(){this._helpWindow=new Window_Help(new Rectangle(0,0,Graphics.boxWidth,60)); this.addWindow(this._helpWindow)};
Scene_CyberJack.prototype.createReplayWindow=function(){
  const w=260,h=120,x=Math.floor((Graphics.boxWidth-w)/2),y=Math.floor((Graphics.boxHeight-h)/2);
  this._replayWindow=new Window_CJReplay(x,y,w,h);
  this._replayWindow.setHandler("yes",()=>{this._replayWindow.close(); this._replayWindow.deactivate(); this._result=null; this._replayDelay=0; this.onReset();});
  this._replayWindow.setHandler("no",()=>{this.popScene()});
  this._replayWindow.openness=0; this.addWindow(this._replayWindow);
};
Scene_CyberJack.prototype.showReplayPrompt=function(){ if(!this._replayWindow) this.createReplayWindow(); this._replayWindow.select(0); this._replayWindow.activate(); this._replayWindow.open(); };
// Top Window Pane
Scene_CyberJack.prototype.helpText = function() {
  var t = this._target;
  var tail = P_UseHex ? (" (" + hex(t) + ")") : "";
  var base = "Target:" + t + tail +
             " | Gold: " + $gameParty.gold() + "g" +
             " | Bet: " + this._bet + "g";


  // When round is ongoing, show the growing bonus
  if (!this._result && this._hitBonus > 0) {
    base += ` | Bonus +x${this._hitBonus.toFixed(2)}`;
  }
  // If a round has finished, show a clear Result tag
  if (this._result) {
    var R = (this._result === "player" ? "YOU WIN"
           : this._result === "dealer" ? "DEALER WINS"
           : "PUSH");
    base += " |  " + R;
  }
  return base;
};
Scene_CyberJack.prototype.resetGame = function() {
  this._deckPlayer = new CyberDeck(this._rnd);
  this._deckDealer = new CyberDeck(this._rnd);
  this._vmPlayer = new CyberVM(this._target);
  this._vmDealer = new CyberVM(this._target);
  this._log = []; this._result = null; this._charged = false;

  // NEW: step-by-step dealer playback state
  this._hitsPaid = 0;         // NEW: how many times we paid a bet this round
  this._hitBonus = 0.0;       // NEW: extra multiplier added to P_PayoutMult
  this._lastBetRefundable = 0; // last bet paid this round (for PUSH refunds)
  this._dealerPlaying = false;      // NEW
  this._dealerDelay   = 0;          // NEW (frames until next dealer step)

  this._updateUi();
};
Scene_CyberJack.prototype._updateUi=function(){ this._statusWindow.setState({target:this._target,accP:this._vmPlayer.acc,bustP:this._vmPlayer.bust,accD:this._vmDealer.acc,bustD:this._vmDealer.bust,stack:[]}); this._helpWindow.setText(this.helpText()); this._logWindow.setLines(this._log); };
Scene_CyberJack.prototype.pushLog=function(t){ this._log.push(t); this._logWindow.setLines(this._log); };

// Bet controls
Scene_CyberJack.prototype._clampBet=function(v){ if(v<P_BetMin)v=P_BetMin; if(v>P_BetMax)v=P_BetMax; return v; };
Scene_CyberJack.prototype.onBetMin=function(){ if(this._charged||this._result){SoundManager.playBuzzer();return;} this._bet=this._clampBet(P_BetMin); SoundManager.playCursor(); this._updateUi(); };
Scene_CyberJack.prototype.onBetDec=function(){ if(this._charged||this._result){SoundManager.playBuzzer();return;} this._bet=this._clampBet(this._bet-P_BetStep); SoundManager.playCursor(); this._updateUi(); };
Scene_CyberJack.prototype.onBetInc=function(){ if(this._charged||this._result){SoundManager.playBuzzer();return;} this._bet=this._clampBet(this._bet+P_BetStep); SoundManager.playCursor(); this._updateUi(); };
Scene_CyberJack.prototype.onBetMax=function(){ if(this._charged||this._result){SoundManager.playBuzzer();return;} this._bet=this._clampBet(P_BetMax); SoundManager.playCursor(); this._updateUi(); };

// Gameplay
Scene_CyberJack.prototype.onHit = function() {
  if (this._result){ SoundManager.playBuzzer(); this._actions.activate(); return; }

  // Lock bet changes after first Hit (keeps your existing behavior)
  if (!this._charged) this._charged = true;

  // NEW: Every Hit costs the base bet
  if ($gameParty.gold() < this._bet) {
    this.pushLog(`[System] Not enough gold (${this._bet}g required).`);
    SoundManager.playBuzzer();
    this._actions.activate(); return;
  }
  $gameParty.gainGold(-this._bet);            // CHANGED: charge on every Hit
  this._hitsPaid++;                             // NEW
  this._lastBetRefundable = this._bet;           // <-- add this
  this._hitBonus = Number((this._hitBonus + P_HitBonusStep).toFixed(2)); // NEW
  this.pushLog(`[System] -${this._bet}g (Hit #${this._hitsPaid}); Bonus -> +x${this._hitBonus.toFixed(2)}`); // NEW
  this._updateUi();                             // keep banner in sync

  // Draw + apply card (unchanged)
  const card = this._deckPlayer.draw();
  if (!card){ this.pushLog("[Player] No more cards."); this._actions.activate(); return; }
  const s = this._vmPlayer.apply(card);
  this.pushLog("[Player] " + card.kind + (card.kind === "POP" ? "" : (card.label ? (" " + card.label) : "")) + " -> " + s);
  if (this._vmPlayer.bust){ this.pushLog("[Player] BUST!"); this.finishRound(); }
  this._updateUi(); this._actions.activate();
};

Scene_CyberJack.prototype.onStand = function() {
  if (this._result) { 
    SoundManager.playBuzzer(); 
    if (this._actions) this._actions.activate(); 
    return; 
  }
  this.pushLog("[Player] stands. Dealer's turn...");
  this._dealerPlaying = true;   // enable autoplay
  this._dealerDelay = 54;       // ~0.3s at 60fps between dealer draws
  if (this._actions) this._actions.deactivate();
  this._updateUi();
};
Scene_CyberJack.prototype.onReset=function(){ this.resetGame(); this._helpWindow.setText(this.helpText()); this._actions.select(0); this._actions.activate(); };

// --- REPLACE this whole function in v1.4 ---
// --- REPLACE THIS WHOLE FUNCTION ---
Scene_CyberJack.prototype.finishRound = function() {
  const t = this._target;
  const pBust = this._vmPlayer.bust, dBust = this._vmDealer.bust;
  const pDiff = pBust ? 999 : Math.abs(t - this._vmPlayer.acc);
  const dDiff = dBust ? 999 : Math.abs(t - this._vmDealer.acc);

  let result = "push";
  if (pBust && dBust) result = "push";
  else if (pBust && !dBust) result = "dealer";
  else if (!pBust && dBust) result = "player";
  else if (pDiff < dDiff) result = "player";
  else if (pDiff > dDiff) result = "dealer";
  else result = "push";

// --- Money & RESULT block (compact, single-line detail) ---
let deltaText = "";
const spent = (this._hitsPaid || 0) * (this._bet || 0);

let resultLine = ""; // <- one line we will append with the RESULT

if (this._charged) {
  if (result === "player") {
    // OPTION A: refund spent + bonus on one bet
    const baseMult  = Number(P_PayoutMult || 0);
    const hitBonus  = Number(this._hitBonus || 0);
    const finalMult = Number((baseMult + hitBonus).toFixed(2));

    const bonus = Math.floor((this._bet || 0) * finalMult);  // one-bet bonus
    const pay   = spent + bonus;                             // total payout

    $gameParty.gainGold(pay);
	playWinEffects(pay);

    deltaText  = `(+${pay}g)`;
    resultLine = `[YOU WIN] +${pay}g | Spent ${spent}g | Mult x${baseMult.toFixed(2)} + Bonus x${hitBonus.toFixed(2)} = x${finalMult.toFixed(2)}`;

  } else if (result === "push") {
    const refund = P_RefundPush ? Number(this._lastBetRefundable || 0) : 0;
    if (refund > 0) {
      $gameParty.gainGold(refund);
      deltaText  = `(+${refund}g refund)`;
      resultLine = `[PUSH] Refund ${refund}g | Last bet ${this._bet}g`;
    } else {
      deltaText  = `(no refund)`;
      resultLine = `[PUSH] No refund`;
    }

  } else { // dealer win
    // All bets were already deducted per Hit
    deltaText  = `(-${spent}g)`;
    resultLine = `[DEALER WINS • YOU LOSE] -${spent}g | Spent ${spent}g`;
  }
}

// RESULT block (now includes the compact detail on the same line)
this.pushLog("");
this.pushLog("========== RESULT ==========");
this.pushLog(`[Result] Player: ${fmt(this._vmPlayer.acc)} | Dealer: ${fmt(this._vmDealer.acc)} | Target: ${fmt(this._target)}`);
this.pushLog(resultLine); // <- the detailed, single-line summary
this.pushLog("============================");


// ---- END: money & message block ----


  // Save result; set any switches/vars
  this._result = result;
  if (P_SwWin)  $gameSwitches.setValue(P_SwWin,  result === "player");
  if (P_SwLose) $gameSwitches.setValue(P_SwLose, result === "dealer");
  if (P_VarMargin) $gameVariables.setValue(P_VarMargin, pDiff);

  // Pause before replay prompt; allow OK to skip
  if (this._actions) this._actions.deactivate();
  this._updateUi();
  this._replayDelay = 60; // ~3.5s at 60fps (tweak if you like)
};


// REPLACE your update() with this version
Scene_CyberJack.prototype.update = function() {
  Scene_Base.prototype.update.call(this);
$gameScreen.update();  // Progresses flash/shake timers each frame

// Drive flash sprite from $gameScreen
const c = $gameScreen.flashColor(); // [r, g, b, a]
if (this._flashOverlay) {
  this._flashOverlay.setColor(c[0], c[1], c[2]); // ONLY RGB here
  this._flashOverlay.opacity = c[3];             // <- alpha goes to opacity
}

// Apply shake to your scene’s visuals
const sx = $gameScreen.shake(); // Horizontal shift amount from shake effect
if (this._backgroundSprite) this._backgroundSprite.x = sx;
if (this._windowLayer)      this._windowLayer.x      = sx;

  // --- Dealer autoplay: reveal one card every _dealerDelay frames ---
  if (this._dealerPlaying) {
    if (this._dealerDelay > 0) {
      this._dealerDelay--;
    } else {
      // If dealer is done, finish; otherwise draw/apply one card
      if (this._vmDealer.bust || this._vmDealer.acc >= this._dealerStand) {
        this._dealerPlaying = false;
        this.finishRound();
      } else {
        var card = this._deckDealer.draw();
        if (!card) {
          this._dealerPlaying = false;
          this.finishRound();
        } else {
          var s = this._vmDealer.apply(card);
          this.pushLog("[Dealer] " + card.kind + (card.kind === "POP" ? "" : (card.label ? (" " + card.label) : "")) + " -> " + s);
          if (this._vmDealer.bust) this.pushLog("[Dealer] BUST!");
          this._dealerDelay = 54; // wait before next step
          this._updateUi();
        }
      }
    }
  }

  // --- Your existing replay timing logic (unchanged) ---
  if (this._result && this._replayDelay > 0) {
    this._replayDelay--;
    if (Input.isTriggered("ok") || TouchInput.isTriggered()) { this._replayDelay = 0; }
    if (this._replayDelay === 0) { this.showReplayPrompt(); }
  }
};


PluginManager.registerCommand(PLUGIN_NAME,"Start",function(args){
  SceneManager.push(Scene_CyberJack);
  SceneManager.prepareNextScene({target:P_Target,dealerStand:P_DealerStand,swWin:P_SwWin,swLose:P_SwLose,varMargin:P_VarMargin});
});
})();