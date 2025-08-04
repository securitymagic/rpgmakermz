/*:
 * @target MZ
 * @plugindesc UI Patch Helper for Virtual Debugger - lets player NOP lines before execution. v1.3
 * @author Luke Acha and ChatGPT
 *
 * @command OpenDebuggerUI
 * @text Open Debugger UI
 * @desc Opens a UI scene to let player inspect and patch debugger instructions.
 *
 * @arg Program
 * @text Program
 * @desc The virtual debugger instruction list to visually patch (newline separated)
 * @type multiline_string
 *
 * @arg OutputVariable
 * @text Output Variable ID
 * @desc Game variable to store the final patched program (string)
 * @type variable
 * @Usage Works with VirtualDebugger Plugin
 */

(() => {
  const PLUGIN_NAME = "DebuggerUIPatcher";

  PluginManager.registerCommand(PLUGIN_NAME, "OpenDebuggerUI", args => {
    const program = args.Program || "";
    const variableId = Number(args.OutputVariable);
    SceneManager.push(Scene_DebuggerUI);
    SceneManager.prepareNextScene(program, variableId);
  });

  class Scene_DebuggerUI extends Scene_MenuBase {
    prepare(program, variableId) {
      this._programText = program;
      this._outputVarId = variableId;
    }

    create() {
      super.create();
      this.parseProgram();
      this.createWindowLayer();
      this.createHelpWindow();
      this.createInstructionWindow();
    }

    parseProgram() {
      this._instructions = this._programText
        .split(/\n/)
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map((line, index) => ({
          index,
          text: line,
          nop: false
        }));
    }

    helpAreaHeight() {
      return this.calcWindowHeight(1, false);
    }

    createHelpWindow() {
      const rect = new Rectangle(0, 0, Graphics.boxWidth, this.helpAreaHeight());
      this._helpWindow = new Window_Help(rect);
      this._helpWindow.setText("Z: Toggle NOP, Q: Apply and Exit, X: Cancel");
      this.addWindow(this._helpWindow);
    }

    createInstructionWindow() {
      const wy = this.helpAreaHeight();
      const wh = Graphics.boxHeight - wy;
      const rect = new Rectangle(0, wy, Graphics.boxWidth, wh);
      this._instructionWindow = new Window_InstructionList(rect, this._instructions);
      this._instructionWindow.setHandler("ok", this.onToggleNop.bind(this));
      this._instructionWindow.setHandler("pageup", this.onFinish.bind(this));
      this._instructionWindow.setHandler("cancel", this.popScene.bind(this));
      this._instructionWindow.setHandler("cancel", this.popScene.bind(this));
      this._instructionWindow.setHandler("pagedown", this.popScene.bind(this));
      this._instructionWindow.activate();
      this._instructionWindow.select(0);
      this.addWindow(this._instructionWindow);
    }

    onToggleNop() {
      const index = this._instructionWindow.index();
      const instr = this._instructions[index];
      if (!instr.text.endsWith(":")) {
        instr.nop = !instr.nop;
        this._instructionWindow.refresh();
        this._instructionWindow.activate();
      }
    }

    onFinish() {
      const result = this._instructions
        .map(instr => instr.nop && !instr.text.endsWith(":") ? "NOP" : instr.text)
        .join("\n");
      if (this._outputVarId > 0) {
        $gameVariables.setValue(this._outputVarId, result);
      }
      this.popScene();
    }
  }

class Window_InstructionList extends Window_Selectable {
  constructor(rect, instructions) {
    super(rect);
    this._instructions = instructions;
    this.refresh();
  }

  maxItems() {
    return this._instructions.length;
  }

  isEnabled(index) {
    const item = this._instructions[index];
    return !item.text.endsWith(":"); // Labels are not selectable
  }

  drawItem(index) {
    const item = this._instructions[index];
    const rect = this.itemRectWithPadding(index);
    const isLabel = item.text.endsWith(":");
    const text = item.nop && !isLabel ? `[NOP] ${item.text}` : item.text;
    this.changePaintOpacity(!isLabel); // dim labels visually
    this.drawText(text, rect.x, rect.y, rect.width);
    this.changePaintOpacity(true);
  }

  cursorDown(wrap) {
    const start = this.index();
    super.cursorDown(wrap);
    while (!this.isEnabled(this.index()) && this.index() !== start) {
      super.cursorDown(wrap);
    }
  }

  cursorUp(wrap) {
    const start = this.index();
    super.cursorUp(wrap);
    while (!this.isEnabled(this.index()) && this.index() !== start) {
      super.cursorUp(wrap);
    }
  }

  refresh() {
    this.contents.clear();
    this.drawAllItems();
  }
}


  window.Scene_DebuggerUI = Scene_DebuggerUI;

})();
