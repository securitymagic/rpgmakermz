/*:
 * @target MZ
 * @plugindesc Simulates a virtual debugger with registers (EAX, EBX, ECX, etc.), conditional logic, patching, and anti-debug traps. v1.2-debugger
 * @author Luke Acha and ChatGPT
 *
 * @command RunDebuggerProgram
 * @text Run Debugger Program
 * @desc Executes a virtual debugger script and outputs a register value to a game variable.
 *
 * @arg Program
 * @text Program
 * @desc Newline-separated instructions like MOV EAX, 0x10\nCMP EAX, EBX\nJZ label
 * @type multiline_string
 *
 * @arg OutputRegister
 * @text Output Register
 * @desc Which register to store in a game variable (e.g., EAX)
 * @default EAX
 *
 * @arg OutputVar
 * @text Output Variable
 * @desc Game variable ID to store the register value after execution
 * @type variable
 *
 * @command RunDebuggerFromVariable
 * @text Run Debugger From Variable
 * @desc Executes debugger script stored in a game variable.
 *
 * @arg ProgramVar
 * @text Program Variable ID
 * @desc ID of the variable holding the debugger program as a string
 * @type variable
 *
 * @arg OutputRegister
 * @text Output Register
 * @desc Which register to store in a game variable (e.g., EAX)
 * @default EAX
 *
 * @arg OutputVar
 * @text Output Variable
 * @desc Game variable ID to store the register value after execution
 * @type variable
 *
 * @command DisassembleDebuggerProgram
 * @text Disassemble Debugger Program
 * @desc Outputs a formatted program listing to a variable for visual inspection.
 *
 * @arg Program
 * @text Program
 * @type multiline_string
 *
 * @arg OutputVar
 * @text Output Variable
 * @type variable
 *
 * @command PatchRegister
 * @text Patch Register
 * @desc Sets the value of a register (e.g., EAX = 0x42) for use before executing a program.
 *
 * @arg Register
 * @text Register Name
 * @desc One of EAX, EBX, ECX, EDX
 * @default EAX
 *
 * @arg Value
 * @text Value
 * @desc Value to assign to the register (number or variable reference)
 * @type string
 */

(() => {
  const PLUGIN_NAME = "VirtualDebugger";
  const globalRegs = {
    EAX: 0,
    EBX: 0,
    ECX: 0,
    EDX: 0,
    ZF: 0
  };

  const parseValue = (val) => {
    if (!val) return 0;
	  // Already a number? Return it directly.
	if (typeof val === "number") return val;
	
	  // Coerce to string just in case
  const str = String(val);
  
    if (val.match(/^V\[(\d+)\]$/i)) return $gameVariables.value(parseInt(RegExp.$1));
    if (val.match(/^0x/i)) return parseInt(val, 16);
    return parseInt(val);
  };

function formatRegisters(regs) {
  return [
    `EAX: ${regs.EAX}`,
    `EBX: ${regs.EBX}`,
    `ECX: ${regs.ECX}`,
    `EDX: ${regs.EDX}`,
    `ZF:  ${regs.ZF}`
  ].join("\n");
}


  PluginManager.registerCommand(PLUGIN_NAME, "PatchRegister", args => {
    const reg = (args.Register || "EAX").toUpperCase();
    const val = parseValue(args.Value);
    if (globalRegs.hasOwnProperty(reg)) globalRegs[reg] = val;
  });

  PluginManager.registerCommand(PLUGIN_NAME, "RunDebuggerFromVariable", args => {
    const varId = Number(args.ProgramVar || 0);
    const code = $gameVariables.value(varId);
    PluginManager.callCommand(null, PLUGIN_NAME, "RunDebuggerProgram", {
      Program: code,
      OutputRegister: args.OutputRegister,
      OutputVar: args.OutputVar
    });
  });

PluginManager.registerCommand(PLUGIN_NAME, "RunDebuggerProgram", args => {
  const lines = args.Program.split(/\n/).map(l => l.trim()).filter(l => l);
  const outputReg = (args.OutputRegister || "EAX").toUpperCase();
  const outputVarId = Number(args.OutputVar || 0);
  const regs = Object.assign({}, globalRegs);
  regs.ZF = 0;

  const labels = {};
  lines.forEach((line, index) => {
    if (line.endsWith(":")) {
      const labelName = line.slice(0, -1).toUpperCase();
      labels[labelName] = index + 1;
    }
  });

  let pc = 0;

  function run() {
    while (pc < lines.length) {
      let line = lines[pc];
      if (line.startsWith("[NOP] ")) line = line.slice(6).trim();
      if (line.endsWith(":")) {
        pc++;
        continue;
      }

      const parts = line.split(/\s+/);
      const instr = parts[0].toUpperCase();
      const arg1 = parts[1]?.replace(/,$/, "").toUpperCase();
      const arg2 = parts[2]?.replace(/,$/, "");

      switch (instr) {
        case "MOV":
          regs[arg1] = regs[arg2] !== undefined ? regs[arg2] : parseValue(arg2);
          break;
        case "ADD":
          regs[arg1] += regs[arg2] !== undefined ? regs[arg2] : parseValue(arg2);
          break;
        case "SUB":
          regs[arg1] -= regs[arg2] !== undefined ? regs[arg2] : parseValue(arg2);
          break;
        case "CMP":
          const a = regs[arg1] !== undefined ? regs[arg1] : parseValue(arg1);
          const b = regs[arg2] !== undefined ? regs[arg2] : parseValue(arg2);
          regs.ZF = a === b ? 1 : 0;
          break;
        case "JZ":
          if (regs.ZF === 1 && labels[arg1] !== undefined) {
            pc = labels[arg1];
            continue;
          }
          break;
        case "JNZ":
          if (regs.ZF === 0 && labels[arg1] !== undefined) {
            pc = labels[arg1];
            continue;
          }
          break;
        case "JMP":
          if (labels[arg1] !== undefined) {
            pc = labels[arg1];
            continue;
          }
          break;
        case "PRINT":
          console.log("[VirtualDebugger]", JSON.stringify(regs));
          break;
        case "CALL":
          console.log("[CALL]", arg1);
          break;
        case "NOP":
          break;
        case "XOR":
          regs[arg1] ^= regs[arg2] !== undefined ? regs[arg2] : parseValue(arg2);
          break;
case "BRK": {
  $gameMessage.add(
    `🛑 Breakpoint hit at line ${pc + 1}:\n${line}\n${formatRegisters(regs)}\nPress OK to continue.`
  );

  // Wait until the message box is dismissed
  const wait = setInterval(() => {
    if (!$gameMessage.isBusy()) {
      clearInterval(wait);
      pc++;
      run(); // Resume debugger execution
    }
  }, 10);

  return; // Stop execution until message is closed
}


        default:
          console.warn("[VirtualDebugger] Unknown instruction:", line);
      }

      pc++;
    }

    // Final result
    if (outputVarId > 0 && regs[outputReg] !== undefined) {
      $gameVariables.setValue(outputVarId, regs[outputReg]);
    }
  }

  run(); // kick off execution
});


  PluginManager.registerCommand(PLUGIN_NAME, "DisassembleDebuggerProgram", args => {
    const lines = args.Program.split(/\n/).map(l => l.trim()).filter(l => l);
    const outputVarId = Number(args.OutputVar || 0);
    let out = "";
    lines.forEach((line, index) => {
      out += `\n[${index}] ${line}`;
    });
    $gameVariables.setValue(outputVarId, out.trim());
  });
})();