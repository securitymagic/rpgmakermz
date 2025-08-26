/*:
 * @target MZ
 * @plugindesc v1.2.1 Cyber Terminal: virtual keyboard, Wordle-style hints, attempts/switches, timed lockout, per-instance overrides (green-on-black).
 * @author Luke Acha and ChatGPT
 *
 * @help CyberTerminalPassword.js
 *
 * Features:
 *  - Center-left terminal window (black bg, green text)
 *  - Right-side candidate list (no title)
 *  - Taller on-screen virtual keyboard
 *  - Type EXIT or QUIT to close
 *  - Wordle-like feedback: correct-position letters colored
 *  - Tracks attempts; sets switches for success/lockout
 *  - Optional timed lockout: auto-unlocks after countdown and fully resets
 *  - Per-instance overrides via OpenTerminalCustom
 *
 * Usage:
 *  - Configure defaults in Plugin Manager
 *  - Event → Plugin Command → CyberTerminal → OpenTerminal (or OpenTerminalCustom for overrides)
 *  - Read results via your configured switches/variables
 *
 * @param PromptText
 * @text Prompt Text
 * @type string
 * @default Enter Password
 *
 * @param PasswordList
 * @text Password List
 * @type string[]
 * @default ["ALPHA","DELTA","KERNEL","NEBULA","CYBER","PHOTON","DRAGON","VECTOR","ZERO","OMEGA"]
 *
 * @param MaxAttempts
 * @text Max Attempts
 * @type number
 * @min 1
 * @default 5
 *
 * @param AttemptsCountVarId
 * @text Attempts Count Variable
 * @type variable
 * @default 0
 *
 * @param PasswordCrackedSwitch
 * @text Password Cracked Switch
 * @type switch
 * @default 0
 *
 * @param MaxAttemptsReachedSwitch
 * @text Max Attempts Reached Switch
 * @type switch
 * @default 0
 *
 * @param ResetOnReenter
 * @text Reset On Re-Enter
 * @type boolean
 * @on Reset
 * @off Keep State
 * @default true
 *
 * @param AutoExitOnCrack
 * @text Auto-Exit On Success
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 *
 * @param AutoExitOnLock
 * @text Auto-Exit On Lockout
 * @type boolean
 * @on Yes
 * @off No
 * @default false
 *
 * @param AutoExitDelay
 * @text Auto-Exit Delay (frames)
 * @type number
 * @min 0
 * @max 600
 * @default 60
 *
 * @param TerminalTextColor
 * @text Terminal Text Color
 * @type string
 * @default #00ff6a
 *
 * @param CorrectPosColor
 * @text Correct Position Color
 * @type string
 * @default #aaff00
 *
 * @param PanelOpacity
 * @text Panel Opacity
 * @type number
 * @min 0
 * @max 255
 * @default 255
 *
 * @param CandidateLengthHint
 * @text Candidate Length Hint
 * @type boolean
 * @on Enable
 * @off Disable
 * @default false
 * @desc If enabled, candidates with the same length as the secret are tinted (hint). Only affects the side panel.
 *
 * @param TimedLockoutEnabled
 * @text Timed Lockout Enabled
 * @type boolean
 * @on Yes
 * @off No
 * @default false
 * @desc If true, a lockout starts a countdown; when it reaches 0 the terminal unlocks and fully resets.
 *
 * @param LockoutSeconds
 * @text Lockout Seconds
 * @type number
 * @min 1
 * @default 30
 * @desc Seconds to wait during timed lockout before auto-reset/unlock.
 *
 * @param ReopenCooldownFrames
 * @text Reopen Cooldown (frames)
 * @type number
 * @min 0
 * @default 12
 * @desc Prevents immediate re-open loops after EXIT/QUIT. 0 = disabled.
 *
 * @command OpenTerminal
 * @text OpenTerminal
 * @desc Opens the cyber terminal scene with default parameters.
 *
 * @command OpenTerminalCustom
 * @text OpenTerminalCustom
 * @desc Opens the terminal with per-instance overrides.
 *
 * @arg PromptText
 * @text Prompt Text
 * @type string
 * @default 
 *
 * @arg PasswordListCSV
 * @text Password List (CSV)
 * @type string
 * @default 
 * @desc Comma-separated (e.g. ALPHA,DELTA,KERNEL)
 *
 * @arg MaxAttempts
 * @text Max Attempts
 * @type number
 * @min 0
 * @default 0
 * @desc 0 = use default
 *
 * @arg AttemptsCountVarId
 * @text Attempts Count Variable
 * @type variable
 * @default 0
 *
 * @arg PasswordCrackedSwitch
 * @text Password Cracked Switch
 * @type switch
 * @default 0
 *
 * @arg MaxAttemptsReachedSwitch
 * @text Max Attempts Reached Switch
 * @type switch
 * @default 0
 *
 * @arg ResetOnReenter
 * @text Reset On Re-Enter
 * @type boolean
 * @on Reset
 * @off Keep State
 * @default 
 *
 * @arg AutoExitOnCrack
 * @text Auto-Exit On Success
 * @type boolean
 * @on Yes
 * @off No
 * @default 
 *
 * @arg AutoExitOnLock
 * @text Auto-Exit On Lockout
 * @type boolean
 * @on Yes
 * @off No
 * @default 
 *
 * @arg AutoExitDelay
 * @text Auto-Exit Delay (frames)
 * @type number
 * @min 0
 * @default 0
 *
 * @arg TerminalTextColor
 * @text Terminal Text Color
 * @type string
 * @default 
 *
 * @arg CorrectPosColor
 * @text Correct Position Color
 * @type string
 * @default 
 *
 * @arg PanelOpacity
 * @text Panel Opacity
 * @type number
 * @min 0
 * @max 255
 * @default 0
 *
 * @arg TimedLockoutEnabled
 * @text Timed Lockout Enabled
 * @type boolean
 * @on Yes
 * @off No
 * @default 
 *
 * @arg LockoutSeconds
 * @text Lockout Seconds
 * @type number
 * @min 0
 * @default 0
 *
 * @arg CandidateLengthHint
 * @text Candidate Length Hint
 * @type boolean
 * @on Enable
 * @off Disable
 * @default 

 */

(() => {
  const PLUGIN_NAME = "CyberTerminalPassword";
  const P = PluginManager.parameters(PLUGIN_NAME);

  // Default config from parameters
  const CFG_DEFAULT = {
    PromptText: String(P.PromptText || "Enter Password"),
    PasswordList: JSON.parse(P.PasswordList || "[]").map(String),
    MaxAttempts: Number(P.MaxAttempts || 5),
    AttemptsCountVarId: Number(P.AttemptsCountVarId || 0),
    PasswordCrackedSwitch: Number(P.PasswordCrackedSwitch || 0),
    MaxAttemptsReachedSwitch: Number(P.MaxAttemptsReachedSwitch || 0),
    ResetOnReenter: P.ResetOnReenter === "true",
    AutoExitOnCrack: P.AutoExitOnCrack === "true",
    AutoExitOnLock: P.AutoExitOnLock === "true",
    AutoExitDelay: Number(P.AutoExitDelay || 60),
    TerminalTextColor: String(P.TerminalTextColor || "#00ff6a"),
    CorrectPosColor: String(P.CorrectPosColor || "#aaff00"),
    PanelOpacity: Number(P.PanelOpacity || 255),
    CandidateLengthHint: P.CandidateLengthHint === "true",
    TimedLockoutEnabled: P.TimedLockoutEnabled === "true",
    LockoutSeconds: Number(P.LockoutSeconds || 30),
    ReopenCooldownFrames: Number(P.ReopenCooldownFrames || 12)
  };

  // Safe deep clone for plain objects/arrays
  const deepClone = o => JSON.parse(JSON.stringify(o));

  // Temp overrides passed via command
  let CYBER_OVERRIDES = null;
  let CYBER_REOPEN_COOLDOWN = 0;

  // Merge helper: prefer override value if meaningful
  function mergeConfig(base, ov) {
    if (!ov) return deepClone(base);
    const cfg = deepClone(base);
    const setIf = (k, v) => {
      if (v === undefined || v === null) return;
      if (typeof v === "string") {
        if (v !== "") cfg[k] = v;
      } else if (typeof v === "number") {
        if (v > 0) cfg[k] = v;
      } else if (typeof v === "boolean") {
        cfg[k] = v;
      } else if (Array.isArray(v)) {
        if (v.length) cfg[k] = v;
      }
    };
    for (const k of Object.keys(ov)) setIf(k, ov[k]);
    return cfg;
  }

  //-------------------------------------------------------------------------
  // State container (per scene entry)
  //-------------------------------------------------------------------------
  class CyberTerminalState {
    constructor(cfg) {
      this.cfg = mergeConfig(CFG_DEFAULT, cfg);
      this.reset(true);
    }
    reset(full = false) {
      if (full || this.cfg.ResetOnReenter) this.secret = this.randomSecret();
      this.prompt = this.cfg.PromptText;
      this.input = "";
      this.attempts = 0;
      this.history = []; // { guess, mask }
      this.locked = false;
      this.cracked = false;
      this.lockoutTimer = 0; // frames
      this.autoExitTimer = 0;
      this.maxLen = this.computeMaxLen();
      this.keyboardEnabled = true;
      this.requestExit = false;
      this.updateAttemptsVar();
      if (this.cfg.PasswordCrackedSwitch) $gameSwitches.setValue(this.cfg.PasswordCrackedSwitch, false);
      if (this.cfg.MaxAttemptsReachedSwitch) $gameSwitches.setValue(this.cfg.MaxAttemptsReachedSwitch, false);
    }
    computeMaxLen() {
      return this.cfg.PasswordList.reduce((m, s) => Math.max(m, s.length), 0) || 8;
    }
    randomSecret() {
      const list = this.cfg.PasswordList;
      if (!list.length) return "PASSWORD";
      const idx = Math.floor(Math.random() * list.length);
      return String(list[idx]);
    }
    setInput(s) { if (this.keyboardEnabled) this.input = s.toUpperCase(); }
    appendChar(ch) { if (this.keyboardEnabled) this.input = (this.input + ch).toUpperCase(); }
    backspace() { if (this.keyboardEnabled) this.input = this.input.slice(0, -1); }
    submit() {
      if (!this.keyboardEnabled) return;
      if (this.locked || this.cracked) return;
      const guess = this.input.trim();
      if (!guess) return;

      // Exit keywords
      if (guess.toUpperCase() === "EXIT" || guess.toUpperCase() === "QUIT") {
        CYBER_REOPEN_COOLDOWN = Math.max(CYBER_REOPEN_COOLDOWN, this.cfg.ReopenCooldownFrames || 0);
        this.requestExit = true;
        this.input = "";
        return;
      }

      this.attempts++;
      this.updateAttemptsVar();

      const mask = this.evaluate(guess);
      this.history.push({ guess, mask });

      if (this.isAllCorrect(mask) && guess.length === this.secret.length) {
        this.cracked = true;
        this.keyboardEnabled = false;
        if (this.cfg.PasswordCrackedSwitch) $gameSwitches.setValue(this.cfg.PasswordCrackedSwitch, true);
        if (this.cfg.AutoExitOnCrack) this.autoExitTimer = this.cfg.AutoExitDelay;
      } else if (this.attempts >= this.cfg.MaxAttempts) {
        this.locked = true;
        this.keyboardEnabled = false;
        if (this.cfg.MaxAttemptsReachedSwitch) $gameSwitches.setValue(this.cfg.MaxAttemptsReachedSwitch, true);
        if (this.cfg.TimedLockoutEnabled) {
          this.lockoutTimer = Math.max(1, Math.floor(this.cfg.LockoutSeconds * 60));
        }
        if (this.cfg.AutoExitOnLock && !this.cfg.TimedLockoutEnabled) {
          this.autoExitTimer = this.cfg.AutoExitDelay;
        }
      }
      this.input = "";
    }
    evaluate(guess) {
      const len = Math.max(guess.length, this.secret.length);
      const mask = new Array(len).fill(false);
      for (let i = 0; i < len; i++) {
        const g = guess[i] || "";
        const s = this.secret[i] || "";
        mask[i] = g === s && g !== "";
      }
      return mask;
    }
    isAllCorrect(mask) {
      const len = this.secret.length;
      for (let i = 0; i < len; i++) if (!mask[i]) return false;
      return true;
    }
    updateAttemptsVar() {
      if (this.cfg.AttemptsCountVarId > 0) $gameVariables.setValue(this.cfg.AttemptsCountVarId, this.attempts);
    }
  }

  //-------------------------------------------------------------------------
  // Scene
  //-------------------------------------------------------------------------
  let CYBER_STATE = null;
  class Scene_CyberTerminal extends Scene_MenuBase {
    create() {
      super.create();
      this.createState();
      this.createWindows();
      this.createKeyboard();
      this._applyWindowStyles();
    }
    start() {
      super.start();
      this._terminalWindow.activate();
      this._keyboardWindow.activate();
    }
    createState() {
      if (!CYBER_STATE || (CYBER_STATE && CYBER_STATE.cfg.ResetOnReenter)) {
        CYBER_STATE = new CyberTerminalState(CYBER_OVERRIDES);
      } else if (CYBER_OVERRIDES) {
        CYBER_STATE.cfg = mergeConfig(CYBER_STATE.cfg, CYBER_OVERRIDES);
      }
      CYBER_OVERRIDES = null;
      this._state = CYBER_STATE;
      // Ensure we clear any lingering exit request from previous run
      this._state.requestExit = false;
    }
    createWindows() {
      const ww = Graphics.boxWidth;
      const wh = Graphics.boxHeight;
      // Terminal (left)
      const tw = Math.floor(ww * 0.52);
      const th = Math.floor(wh * 0.70);
      const tx = Math.floor(ww * 0.04);
      const ty = Math.floor(wh * 0.06);
      this._terminalWindow = new Window_CyberTerminal(tx, ty, tw, th, this._state);
      this.addWindow(this._terminalWindow);
      // Candidate panel (right)
      const pw = Math.floor(ww * 0.38);
      const px = tx + tw + Math.floor(ww * 0.02);
      const ph = th;
      const py = ty;
      this._panelWindow = new Window_CyberPanel(px, py, pw, ph, this._state);
      this.addWindow(this._panelWindow);
    }
    createKeyboard() {
      const ww = Graphics.boxWidth;
      const wh = Graphics.boxHeight;
      const kw = Math.floor(ww * 0.96);
      const kh = Math.floor(wh * 0.26); // taller
      const kx = Math.floor((ww - kw) / 2);
      const ky = Math.floor(wh * 0.74);
      this._keyboardWindow = new Window_CyberKeyboard(kx, ky, kw, kh, this._state);
      this._keyboardWindow.setHandler("ok", this.onKeyboardOK.bind(this));
      this._keyboardWindow.setHandler("cancel", this.onKeyboardCancel.bind(this));
      this.addWindow(this._keyboardWindow);
    }
    _applyWindowStyles() {
      const windows = [this._terminalWindow, this._panelWindow, this._keyboardWindow];
      for (const w of windows) {
        w.opacity = this._state.cfg.PanelOpacity;
        w.backOpacity = this._state.cfg.PanelOpacity;
        if (w.setTerminalColors) w.setTerminalColors(this._state.cfg.TerminalTextColor, this._state.cfg.CorrectPosColor);
        w.refresh();
      }
    }
    update() {
      super.update();
      const s = this._state;

      // Request exit (EXIT/QUIT)
      if (s.requestExit) {
        this.popScene();
        return;
      }

      // Timed lockout countdown
      if (s.locked && s.cfg.TimedLockoutEnabled && s.lockoutTimer > 0) {
        s.lockoutTimer--;
        if (Graphics.frameCount % 10 === 0) this._terminalWindow.refresh();
        if (s.lockoutTimer <= 0) {
          s.reset(true);
          this._terminalWindow.refresh();
          this._panelWindow.refresh();
          this._keyboardWindow.activate();
        }
      }

      // Auto exit timers
      if (s.autoExitTimer > 0) {
        s.autoExitTimer--;
        if (s.autoExitTimer <= 0) this.popScene();
      }

      this.updatePhysicalTyping();
    }
    terminate() {
      super.terminate();
      if (this._state) this._state.requestExit = false;
    }
    terminate() {
      super.terminate();
      if (this._state) this._state.requestExit = false; // clear lingering flag
    }
    updatePhysicalTyping() {
      const s = this._state;
      if (!s.keyboardEnabled) return;
      if (Input.isRepeated("backspace")) {
        s.backspace();
        this._terminalWindow.refresh();
        return;
      }
      if (Input.isTriggered("ok")) {
        s.submit();
        this._terminalWindow.refresh();
        this._panelWindow.refresh();
        return;
      }
    }
    onKeyboardOK() {
      const sym = this._keyboardWindow.currentSymbol();
      if (!sym) return;
      if (sym === "<BACK") this._state.backspace();
      else if (sym === "<ENTER") this._state.submit();
      else if (sym === "<EXIT") { CYBER_REOPEN_COOLDOWN = Math.max(CYBER_REOPEN_COOLDOWN, this._state.cfg.ReopenCooldownFrames || 0); this.popScene(); }
      else this._state.appendChar(sym);
      this._terminalWindow.refresh();
      this._panelWindow.refresh();
      this._keyboardWindow.activate();
    }
    onKeyboardCancel() {
      this._state.backspace();
      this._terminalWindow.refresh();
      this._keyboardWindow.activate();
    }
  }

  //-------------------------------------------------------------------------
  // Window base (shared helpers)
  //-------------------------------------------------------------------------
  class Window_CyberBase extends Window_Selectable {
    initialize(x, y, w, h, state) {
      super.initialize(new Rectangle(x, y, w, h));
      this._state = state;
      this._termColor = state.cfg.TerminalTextColor;
      this._correctColor = state.cfg.CorrectPosColor;
      this.openness = 255;
    }
    setTerminalColors(term, correct) { this._termColor = term; this._correctColor = correct; }
    drawBlackBackground() { this.contents.clear(); this.contents.fillRect(0, 0, this.contents.width, this.contents.height, "#000000"); }
    termColor() { return this._termColor; }
    correctColor() { return this._correctColor; }
    drawTermText(text, x, y, w) { this.changeTextColor(this.termColor()); this.contents.drawText(text, x, y, w, this.lineHeight(), "left"); this.resetTextColor(); }
    drawColoredGuess(guess, mask, x, y) {
      const lh = this.lineHeight();
      const cw = this.textWidth("W");
      for (let i = 0; i < guess.length; i++) {
        const ch = guess[i];
        this.changeTextColor(mask[i] ? this.correctColor() : this.termColor());
        this.contents.drawText(ch, x + i * (cw + 2), y, cw + 8, lh, "left");
      }
      this.resetTextColor();
    }
  }

  //-------------------------------------------------------------------------
  // Terminal Window
  //-------------------------------------------------------------------------
  class Window_CyberTerminal extends Window_CyberBase {
    refresh() {
      this.drawBlackBackground();
      const pad = 12;
      let y = pad;
      const w = this.contents.width - pad * 2;

      // Prompt
      this.changeTextColor(this.termColor());
      this.contents.fontBold = true;
      this.contents.drawText(this._state.prompt, pad, y, w, this.lineHeight(), "left");
      this.contents.fontBold = false;
      y += this.lineHeight() + 4;

      // Status
      const s = this._state;
      let status = `Attempts: ${s.attempts}/${s.cfg.MaxAttempts}`;
      if (s.cracked) status = "ACCESS GRANTED";
      else if (s.locked) {
        if (s.cfg.TimedLockoutEnabled && s.lockoutTimer > 0) {
          const secs = Math.ceil(s.lockoutTimer / 60);
          const mm = String(Math.floor(secs / 60)).padStart(2, '0');
          const ss = String(secs % 60).padStart(2, '0');
          status = `LOCKED OUT (${mm}:${ss})`;
        } else {
          status = "LOCKED OUT";
        }
      }
      this.drawTermText(status, pad, y, w);
      y += this.lineHeight() + 8;

      // History
      for (let i = Math.max(0, s.history.length - 8); i < s.history.length; i++) {
        const { guess, mask } = s.history[i];
        this.drawColoredGuess(guess, mask, pad, y);
        y += this.lineHeight();
      }

      y += 6;
      // Current input
      if (!s.cracked && !s.locked) {
        const caret = (Graphics.frameCount % 40 < 20) ? "_" : " ";
        const inputLine = "> " + (s.input || "") + caret;
        this.drawTermText(inputLine, pad, y, w);
      } else if (s.cracked) {
        this.changeTextColor(this.correctColor());
        this.contents.drawText("> Password Accepted.", pad, y, w, this.lineHeight(), "left");
        this.resetTextColor();
      }
    }
  }

  //-------------------------------------------------------------------------
  // Candidate Panel (no title, no footer)
  //-------------------------------------------------------------------------
  class Window_CyberPanel extends Window_CyberBase {
    refresh() {
      this.drawBlackBackground();
      const pad = 12;
      let y = pad;
      const w = this.contents.width - pad * 2;
      const s = this._state;
      const list = s.cfg.PasswordList;
      for (let i = 0; i < list.length; i++) {
        const pw = String(list[i]);
        this.changeTextColor((s.cfg.CandidateLengthHint && pw.length === s.secret.length) ? this.correctColor() : this.termColor());
        this.contents.drawText(pw, pad, y, w, this.lineHeight(), "left");
        this.resetTextColor();
        y += this.lineHeight();
      }
    }
  }

  //-------------------------------------------------------------------------
  // Virtual Keyboard (taller visual)
  //-------------------------------------------------------------------------
  class Window_CyberKeyboard extends Window_CyberBase {
    initialize(x, y, w, h, state) {
      super.initialize(x, y, w, h, state);
      this._symbols = this.buildSymbols();
      this.refresh();
      this.activate();
      this.select(0);
    }
    maxCols() { return 12; }
    maxItems() { return this._symbols.length; }
    itemHeight() { return this.lineHeight() + 8; }
    buildSymbols() {
      const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
      const digits = "0123456789".split("");
      const special = ["<BACK", "<ENTER", "<EXIT"];
      return [...letters, ...digits, ...special];
    }
    currentSymbol() { return this._symbols[this.index()]; }
    drawAllItems() { this.contents.clear(); this.drawBlackBackground(); super.drawAllItems(); }
    drawItem(index) {
      const rect = this.itemRect(index);
      this.resetTextColor();
      this.changeTextColor(this.termColor());
      const sym = this._symbols[index];
      this.contents.drawText(sym, rect.x, rect.y, rect.width, rect.height, "center");
      this.resetTextColor();
    }
    processOk() { SoundManager.playOk(); super.processOk(); }
    processCancel() { SoundManager.playCancel(); this.callCancelHandler(); }
  }

  // Map Backspace key
  const _CTP_alias_onKeyDown = Input._onKeyDown.bind(Input);
  Input._onKeyDown = function(event) {
    _CTP_alias_onKeyDown(event);
    if (event.key === "Backspace") this._currentState["backspace"] = true;
  };

  // Re-open suppression tick on map
  const _CTP_Map_update = Scene_Map.prototype.update;
  Scene_Map.prototype.update = function() {
    _CTP_Map_update.call(this);
    if (typeof CYBER_REOPEN_COOLDOWN === 'number' && CYBER_REOPEN_COOLDOWN > 0) CYBER_REOPEN_COOLDOWN--;
  };

  //-------------------------------------------------------------------------
  // Plugin Commands
  //-------------------------------------------------------------------------
  PluginManager.registerCommand(PLUGIN_NAME, "OpenTerminal", () => {
    if (CYBER_REOPEN_COOLDOWN > 0) return; // guard re-entry loop
    CYBER_OVERRIDES = null;
    SceneManager.push(Scene_CyberTerminal);
  });

  PluginManager.registerCommand(PLUGIN_NAME, "OpenTerminalCustom", args => {
    if (CYBER_REOPEN_COOLDOWN > 0) return; // guard re-entry loop
    const o = {};
    if (args.PromptText) o.PromptText = String(args.PromptText);
    if (args.PasswordListCSV) o.PasswordList = String(args.PasswordListCSV).split(',').map(s => s.trim()).filter(Boolean).map(s => s.toUpperCase());
    const num = k => { const n = Number(args[k] || 0); return n > 0 ? n : 0; };
    const bool = k => (args[k] === "true" ? true : (args[k] === "false" ? false : undefined));
    if (num('MaxAttempts')) o.MaxAttempts = num('MaxAttempts');
    if (num('AttemptsCountVarId')) o.AttemptsCountVarId = num('AttemptsCountVarId');
    if (num('PasswordCrackedSwitch')) o.PasswordCrackedSwitch = num('PasswordCrackedSwitch');
    if (num('MaxAttemptsReachedSwitch')) o.MaxAttemptsReachedSwitch = num('MaxAttemptsReachedSwitch');
    const rre = bool('ResetOnReenter'); if (rre !== undefined) o.ResetOnReenter = rre;
    const aec = bool('AutoExitOnCrack'); if (aec !== undefined) o.AutoExitOnCrack = aec;
    const ael = bool('AutoExitOnLock'); if (ael !== undefined) o.AutoExitOnLock = ael;
    if (num('AutoExitDelay')) o.AutoExitDelay = num('AutoExitDelay');
    if (args.TerminalTextColor) o.TerminalTextColor = String(args.TerminalTextColor);
    if (args.CorrectPosColor) o.CorrectPosColor = String(args.CorrectPosColor);
    if (num('PanelOpacity')) o.PanelOpacity = num('PanelOpacity');
    const tle = bool('TimedLockoutEnabled'); if (tle !== undefined) o.TimedLockoutEnabled = tle;
    if (num('LockoutSeconds')) o.LockoutSeconds = num('LockoutSeconds');
	const clh = bool('CandidateLengthHint'); if (clh !== undefined) o.CandidateLengthHint = clh;

    CYBER_OVERRIDES = o;
    SceneManager.push(Scene_CyberTerminal);
  });
})();

