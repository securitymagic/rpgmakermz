// RPG Maker MZ Plugin: Slot Machine using IconSet
// Author: ChatGPT
// Description: Slot machine mini-game using icons from the IconSet

(() => {
  const SLOT_ROWS = 5;
  const SLOT_COLS = 5;
  const ICON_WIDTH = 32;
  const ICON_HEIGHT = 32;
  const ICON_IDS = [1, 72, 73, 81, 84, 89, 300, 47];
  const ICON_VALUES = {
    1: 0,
	72: 1,
    73: 2,
    81: 3,
    84: 4,
    89: 5,
    300: 8,
    47: 10
  };
  const ICON_WEIGHTS = {
    1: 60,
	72: 30,
    73: 25,
    81: 20,
    84: 15,
    89: 10,
    300: 5,
    47: 2
  };
  const SPIN_DURATION = 60;
  const MIN_BET = 100;
  const MAX_BET = 1000;

  class Scene_SlotMachine extends Scene_Base {
    create() {
      super.create();
      this._reels = [];
      this._spinners = [];
      this._results = [];
      this._frameCount = 0;
      this._resultShown = false;
      this._initialized = false;
      this._resultMessage = "";
      this._betAmount = MIN_BET;
      this.createBackground();
      this.createLegend();
      this.createReels();
      this.createSpinButton();
      this.createExitButton();
      this.createMessageWindow();
      this.createInfoWindow();
      this.createBetButtons();
      this._initialized = true;
    }

    createBackground() {
      this._background = new Sprite();
      this._background.bitmap = new Bitmap(Graphics.width, Graphics.height);
      this._background.bitmap.fillAll("#000");
      this.addChild(this._background);
    }

    createLegend() {
      this._legendSprites = [];
      const spacing = 48;
      const startX = (Graphics.boxWidth - (ICON_IDS.length * spacing)) / 2;
      ICON_IDS.forEach((iconId, i) => {
        const sprite = new Sprite(new Bitmap(spacing, 48));
        sprite.x = startX + i * spacing;
        sprite.y = 8;
        const bmp = sprite.bitmap;
        const iconBmp = ImageManager.loadSystem("IconSet");
        const sx = (iconId % 16) * ICON_WIDTH;
        const sy = Math.floor(iconId / 16) * ICON_HEIGHT;
        bmp.blt(iconBmp, sx, sy, ICON_WIDTH, ICON_HEIGHT, 0, 0);
        bmp.textColor = "#fff";
        bmp.drawText("x" + ICON_VALUES[iconId], 0, ICON_HEIGHT, spacing, 16, "center");
        this.addChild(sprite);
        this._legendSprites.push(sprite);
      });
    }

    createSpinButton() {
      const bmp = new Bitmap(120, 40);
      bmp.fillRect(0, 0, 120, 40, "#fff");
      bmp.drawText("SPIN", 0, 0, 120, 40, "center");
      this._spinButton = new Sprite(bmp);
      this._spinButton.x = (Graphics.width - 120) / 2;
      this._spinButton.y = Graphics.height - 100;
      this._spinButton.setFrame(0, 0, 120, 40);
      this.addChild(this._spinButton);
    }

    createExitButton() {
      const bmp = new Bitmap(60, 30);
      bmp.fillRect(0, 0, 60, 30, "#f66");
      bmp.drawText("EXIT", 0, 0, 60, 30, "center");
      this._exitButton = new Sprite(bmp);
      this._exitButton.x = Graphics.width - 70;
      this._exitButton.y = Graphics.height - 40;
      this._exitButton.setFrame(0, 0, 60, 30);
      this.addChild(this._exitButton);
    }

    createMessageWindow() {
      this._messageWindow = new Window_Base(new Rectangle(0, Graphics.height - 100, Graphics.width, 100));
      this._messageWindow.refresh = () => {
        this._messageWindow.contents.clear();
        this._messageWindow.drawText(this._resultMessage, 0, 0, Graphics.width, 36, "center");
      };
      this.addChild(this._messageWindow);
    }

    createInfoWindow() {
      this._infoWindow = new Window_Base(new Rectangle(Graphics.width - 200, 56, 180, 80));
      this._infoWindow.lineHeight = () => 24;
      this._infoWindow.refresh = () => {
        this._infoWindow.contents.clear();
        const gold = $gameParty.gold();
        const bet = this._betAmount;
        this._infoWindow.drawText(`Gold: ${gold}`, 0, 0, 180, 24, "center");
        this._infoWindow.drawText(`Bet: ${bet}`, 0, 24, 180, 24, "center");
      };
      this._infoWindow.refresh();
      this.addChild(this._infoWindow);
    }

    createBetButtons() {
      const makeButton = (label) => {
        const bmp = new Bitmap(30, 30);
        bmp.fillRect(0, 0, 30, 30, "#fff");
        bmp.drawText(label, 0, 0, 30, 30, "center");
        return new Sprite(bmp);
      };

      this._plusButton = makeButton("+");
      this._plusButton.x = Graphics.width - 80;
      this._plusButton.y = 56 + 80;
      this.addChild(this._plusButton);

      this._minusButton = makeButton("–");
      this._minusButton.x = Graphics.width - 120;
      this._minusButton.y = 56 + 80;
      this.addChild(this._minusButton);
    }

    createReels() {
      const startX = (Graphics.boxWidth - (SLOT_COLS * ICON_WIDTH)) / 2;
      const startY = 100; // Moved down to avoid overlapping legend
      for (let col = 0; col < SLOT_COLS; col++) {
        this._reels[col] = [];
        for (let row = 0; row < SLOT_ROWS; row++) {
          const sprite = new Sprite(new Bitmap(ICON_WIDTH, ICON_HEIGHT));
          sprite.x = startX + col * ICON_WIDTH;
          sprite.y = startY + row * ICON_HEIGHT;
          this.drawIconOnSprite(sprite, this.getRandomIcon());
          this.addChild(sprite);
          this._reels[col][row] = sprite;
        }
      }
    }

    getRandomIcon() {
      const totalWeight = ICON_IDS.reduce((sum, id) => sum + ICON_WEIGHTS[id], 0);
      let rand = Math.random() * totalWeight;
      for (let id of ICON_IDS) {
        rand -= ICON_WEIGHTS[id];
        if (rand <= 0) return id;
      }
      return ICON_IDS[0];
    }

    startSpin() {
      if ($gameParty.gold() < this._betAmount) {
        this._resultMessage = "Not enough gold!";
        this._messageWindow.refresh();
        return;
      }

      for (let i = 0; i < SLOT_COLS; i++) {
        this._spinners[i] = SPIN_DURATION + i * 15;
      }
      this._frameCount = 0;
      this._results = [];
      this._resultShown = false;
      this._resultMessage = "";
      this._messageWindow.refresh();
      this._infoWindow.refresh();
    }

    update() {
      super.update();

      if (Input.isTriggered("cancel")) {
        SceneManager.pop();
        return;
      }

      if (TouchInput.isTriggered()) {
        const x = TouchInput.x;
        const y = TouchInput.y;

        const isIn = (sprite) => x >= sprite.x && x < sprite.x + sprite.width && y >= sprite.y && y < sprite.y + sprite.height;

        if (isIn(this._spinButton)) return this.startSpin();
        if (isIn(this._exitButton)) return SceneManager.pop();
        if (isIn(this._plusButton)) {
          this._betAmount = Math.min(MAX_BET, this._betAmount + 100);
          this._infoWindow.refresh();
          return;
        }
        if (isIn(this._minusButton)) {
          this._betAmount = Math.max(MIN_BET, this._betAmount - 100);
          this._infoWindow.refresh();
          return;
        }
      }

      for (let col = 0; col < SLOT_COLS; col++) {
        if (this._spinners[col] > 0) {
          this._spinners[col]--;
          for (let row = 0; row < SLOT_ROWS; row++) {
            const sprite = this._reels[col][row];
            if (!sprite) continue;
            const iconId = this.getRandomIcon();
            this.drawIconOnSprite(sprite, iconId);
            if (!this._results[row]) this._results[row] = [];
            if (this._spinners[col] === 0) this._results[row][col] = iconId;
          }
        }
      }

      if (!this._resultShown && this._spinners.every(s => s === 0) && this._results.length === SLOT_ROWS) {
        this.checkWin();
        this._resultShown = true;
        this._messageWindow.refresh();
        this._infoWindow.refresh();
      }
    }

    drawIconOnSprite(sprite, iconIndex) {
      const bitmap = ImageManager.loadSystem("IconSet");
      const sx = (iconIndex % 16) * ICON_WIDTH;
      const sy = Math.floor(iconIndex / 16) * ICON_HEIGHT;
      sprite.bitmap.clear();
      sprite.bitmap.blt(bitmap, sx, sy, ICON_WIDTH, ICON_HEIGHT, 0, 0);
    }

checkWin() {
  let totalGain = 0;
  let messages = [];

  for (const row of this._results) {
    if (!row || row.length < 2) continue;
    const icon = row[0];
	if (ICON_VALUES[icon] === 0) continue; // skip dud row
    let matchCount = 1;
    for (let i = 1; i < row.length; i++) {
      if (row[i] === icon) matchCount++;
      else break;
    }
    const minMatch = (icon === 72) ? 2 : 3; // icon 72 is the lowest value one
    if (matchCount >= minMatch) {
      const multiplier = ICON_VALUES[icon] * matchCount;
      const gain = this._betAmount * multiplier;
      totalGain += gain;
      messages.push(`${matchCount}x Icon ${icon} (x${multiplier})`);
    }
  }

  if (totalGain > 0) {
    $gameParty.gainGold(totalGain);
    messages.push(`Total Gain: ${totalGain}G`);
    this._resultMessage = "You won " + totalGain + "G!";
  if (totalGain >= 10000) {
    AudioManager.playSe({ name: "Chime2", pan: 0, pitch: 100, volume: 100 }); // Huge jackpot
  } else if (totalGain >= 1000) {
    AudioManager.playSe({ name: "Saint5", pan: 0, pitch: 100, volume: 100 }); // Normal jackpot
  } else {
    AudioManager.playSe({ name: "Sound1", pan: 0, pitch: 100, volume: 90 }); // Small win
  }
} else {
  this._resultMessage = "No win. Try again!";
  $gameParty.loseGold(this._betAmount);
}
}

  }

  window.Scene_SlotMachine = Scene_SlotMachine;

  PluginManager.registerCommand("SlotMachine", "Start", () => {
    SceneManager.push(Scene_SlotMachine);
  });
})();
