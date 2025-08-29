/*:
 * @target MZ
 * @plugindesc Per-character sprite pixel offsets (map + UI/save) v1.2 — file picker for sheets
 * @author Luke Acha and ChatGPT
 *
 * @help CharacterOffsetMZ.js
 * Adds configurable X/Y pixel offsets for character sheets by filename.
 * Applies on-map and in UI (save/load, menus). Now uses a file picker so you
 * don't have to type names manually.
 *
 * Usage:
 *  - Add an entry under "Offsets", click the file field, pick the sheet in
 *    img/characters/. Keep the $ if it’s a single-character sheet.
 *  - Set dx/dy (pixels). Positive dy moves DOWN.
 *  - "Exact Match" ON means the chosen file must match exactly (recommended).
 *
 * @param Offsets
 * @type struct<Offset>[]
 * @default []
 */
/*~struct~Offset:
 * @param file
 * @text Character Sheet
 * @type file
 * @dir img/characters
 * @desc Pick the character sheet PNG from img/characters/.
 *
 * @param exact
 * @text Exact Match
 * @type boolean
 * @on Yes
 * @off No
 * @desc If ON, only this exact filename (ignores .png) will match.
 * @default true
 *
 * @param dx
 * @text X Offset (pixels)
 * @type number
 * @min -999
 * @max 999
 * @default 0
 *
 * @param dy
 * @text Y Offset (pixels)
 * @type number
 * @min -999
 * @max 999
 * @default 0
 */

(() => {
  "use strict";
  const PLUGIN_NAME = "CharacterOffsetMZ";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const rawList = JSON.parse(params.Offsets || "[]");

  function baseNameNoExt(p) {
    if (!p) return "";
    // Remove directory part if present
    const just = p.replace(/\\/g, "/").split("/").pop();
    // Remove extension (e.g., .png)
    return just.replace(/\.[^.]+$/i, "");
  }

  const OFFSETS = rawList.map(s => {
    const o = JSON.parse(s);
    const file = String(o.file || "");
    return {
      // normalized like "$sample_transparent"
      key: baseNameNoExt(file).toLowerCase(),
      exact: String(o.exact || "true") === "true",
      dx: Number(o.dx || 0),
      dy: Number(o.dy || 0),
    };
  });

  function findOffsetFor(engineName) {
    // engineName is already base name with no extension, e.g. "$Actor1"
    const name = (engineName || "").toLowerCase();
    for (const o of OFFSETS) {
      if (!o.key) continue;
      if (o.exact) {
        if (name === o.key) return { dx: o.dx, dy: o.dy };
      } else {
        if (name.includes(o.key)) return { dx: o.dx, dy: o.dy };
      }
    }
    return { dx: 0, dy: 0 };
  }

  // ---------------- MAP SPRITES ----------------
  const _Sprite_Character_initMembers = Sprite_Character.prototype.initMembers;
  Sprite_Character.prototype.initMembers = function() {
    _Sprite_Character_initMembers.call(this);
    this._co_dx = 0;
    this._co_dy = 0;
    this._co_lastName = null;
  };

  const _Sprite_Character_updateBitmap = Sprite_Character.prototype.updateBitmap;
  Sprite_Character.prototype.updateBitmap = function() {
    _Sprite_Character_updateBitmap.call(this);
    const name = this._characterName;
    if (name !== this._co_lastName) {
      const off = findOffsetFor(name);
      this._co_dx = off.dx;
      this._co_dy = off.dy;
      this._co_lastName = name;
    }
  };

  const _Sprite_Character_updatePosition = Sprite_Character.prototype.updatePosition;
  Sprite_Character.prototype.updatePosition = function() {
    _Sprite_Character_updatePosition.call(this);
    this.x += this._co_dx;
    this.y += this._co_dy; // anchor (0.5,1); +dy pushes down
  };

  // ---------------- UI DRAWS (SAVE/LOAD/etc.) ----------------
  Window_Base.prototype.drawCharacterWithOffset = function(characterName, characterIndex, x, y, dx, dy) {
    const bitmap = ImageManager.loadCharacter(characterName);
    const big = ImageManager.isBigCharacter(characterName);
    const pw = bitmap.width / (big ? 3 : 12);
    const ph = bitmap.height / (big ? 4 : 8);
    const n = characterIndex;
    const sx = ((n % 4) * 3 + 1) * pw;
    const sy = Math.floor(n / 4) * 4 * ph;
    const destX = Math.floor(x - pw / 2 + dx);
    const destY = Math.floor(y - ph + dy);
    this.contents.blt(bitmap, sx, sy, pw, ph, destX, destY);
  };

  const _Window_Base_drawCharacter = Window_Base.prototype.drawCharacter;
  Window_Base.prototype.drawCharacter = function(characterName, characterIndex, x, y) {
    const off = findOffsetFor(characterName);
    if ((off.dx || off.dy) && this && this.contents) {
      this.drawCharacterWithOffset(characterName, characterIndex, x, y, off.dx, off.dy);
    } else {
      _Window_Base_drawCharacter.call(this, characterName, characterIndex, x, y);
    }
  };
})();
