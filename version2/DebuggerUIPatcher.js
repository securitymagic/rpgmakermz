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
	  const hintRect = new Rectangle(Graphics.boxWidth - 300, this.helpAreaHeight(), 300, 200);
this._hintWindow = new Window_InstructionHint(hintRect);
this._hintWindow.setText("NOP — Skip this line\nCMP EAX, 10\nJNZ label\nBRK - Set Breakpoint");
this.addChild(this._hintWindow);

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
      this._helpWindow.setText("Z: Edit, Q: Apply and Exit, X: Cancel");
      this.addWindow(this._helpWindow);
    }

    createInstructionWindow() {
      const wy = this.helpAreaHeight();
      const wh = Graphics.boxHeight - wy;
      const rect = new Rectangle(0, wy, Graphics.boxWidth, wh);
      this._instructionWindow = new Window_InstructionList(rect, this._instructions);
      this._instructionWindow.setHandler("ok", this.onEditLine.bind(this));
      this._instructionWindow.setHandler("pageup", this.onFinish.bind(this));
      this._instructionWindow.setHandler("cancel", this.popScene.bind(this));
      this._instructionWindow.setHandler("pagedown", this.popScene.bind(this));
      this._instructionWindow.activate();
      this._instructionWindow.select(0);
      this.addWindow(this._instructionWindow);
    }

onEditLine() {
  const index = this._instructionWindow.index();
  const instr = this._instructions[index];
  const defaultText = instr.text;
  const newText = prompt(`Edit instruction:\n(Original: ${defaultText})`, defaultText);

  if (newText && newText.trim().length > 0) {
    const trimmed = newText.trim();
    const parts = trimmed.toUpperCase().split(/\s+/);
    const op = parts[0];
    const validOps = ["NOP", "CMP", "MOV", "XOR", "JNZ", "JZ", "JMP", "BRK"];
    const validRegs = ["EAX", "EBX", "ECX", "EDX"];

    if (!validOps.includes(op)) {
      alert(`Invalid opcode: ${op}`);
      this._instructionWindow.activate();
      return;
    }

    if (op === "NOP") {
      if (parts.length > 1 && !trimmed.startsWith("NOP ")) {
        alert(`Invalid use of NOP. Either use 'NOP' or 'NOP ...comment'`);
        this._instructionWindow.activate();
        return;
      }
    } else if (["CMP", "MOV", "XOR"].includes(op)) {
      const match = trimmed.match(/^(\w+)\s+([A-Z]+),\s*(.+)$/i);
      if (!match || !validRegs.includes(match[2])) {
        alert(`Invalid syntax. Example: ${op} EAX, 500`);
        this._instructionWindow.activate();
        return;
      }
    } else if (["JNZ", "JZ", "JMP"].includes(op)) {
      if (parts.length < 2) {
        alert(`Missing label for ${op}. Example: ${op} loop_start`);
        this._instructionWindow.activate();
        return;
      }
    }

if (trimmed.toUpperCase() === "BRK") {
  // Insert BRK after current line without replacing
  const newInstr = {
    index: instr.index + 0.5,
    text: "BRK",
    nop: false
  };
  this._instructions.splice(index + 1, 0, newInstr);
  // Re-index all
  this._instructions.forEach((line, i) => line.index = i);
} else {
  instr.text = trimmed;
  instr.nop = (op === "NOP") && !trimmed.endsWith(":");
}
  }

  this._instructionWindow.refresh();
  this._instructionWindow.activate();
}



    onFinish() {
      const result = this._instructions.map(instr => instr.nop ? "NOP" : instr.text).join("\n");
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
      return !item.text.endsWith(":");
    }

    drawItem(index) {
      const item = this._instructions[index];
      const rect = this.itemRectWithPadding(index);
      const isLabel = item.text.endsWith(":");
      const text = item.nop && !isLabel ? `[NOP] ${item.text}` : item.text;
      this.changePaintOpacity(!isLabel);
      this.drawText(text, rect.x, rect.y, rect.width);
      this.changePaintOpacity(true);
	  if (item.text.toUpperCase().startsWith("BRK")) {
  this.changeTextColor(ColorManager.crisisColor);
}

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
class Window_InstructionHint extends Window_Base {
  initialize(rect) {
    super.initialize(rect);
    this.setText("");
  }

  setText(text) {
    this._text = text;
    this.refresh();
  }

  refresh() {
    this.contents.clear();
    this.drawTextEx(this._text, 0, 0);
  }
}
  window.Scene_DebuggerUI = Scene_DebuggerUI;
})();

