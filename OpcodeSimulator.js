/*:
 * @target MZ
 * @plugindesc Simulates a basic opcode interpreter with hex support, conditional logic, and disassembler for puzzles. v1.3-opcodesim
 * @author Luke Acha and ChatGPT
 *
 * @command RunOpcode
 * @text Run Opcode Program
 * @desc Executes a predefined program and stores the output in a game variable.
 *
 * @arg Program
 * @text Program
 * @desc A comma-separated list of opcodes (e.g. PUSH 5, PUSH 0xA, ADD, PRINT)
 * @type multiline_string
 *
 * @arg OutputVar
 * @text Output Variable
 * @desc Variable ID to store the result (top of stack after execution)
 * @type variable
 *
 * @command DisassembleOpcode
 * @text Disassemble Program
 * @desc Outputs a formatted instruction list into a game variable (for visual display).
 *
 * @arg Program
 * @text Program
 * @desc Comma-separated opcodes (same format as RunOpcode)
 * @type multiline_string
 *
 * @arg OutputVar
 * @text Output Variable
 * @desc Variable ID to store the disassembled string
 * @type variable
 */

(() => {
  const PLUGIN_NAME = "OpcodeSimulator";

  PluginManager.registerCommand(PLUGIN_NAME, "RunOpcode", args => {
    const programText = args.Program || "";
    const outputVarId = Number(args.OutputVar || 0);

    const lines = programText.split(/\n|,/).map(l => l.trim()).filter(l => l);
    const stack = [];
    const labels = {};
    let pc = 0;

    // First pass: collect labels
    lines.forEach((line, index) => {
      if (line.endsWith(":")) {
        const label = line.slice(0, -1).toUpperCase();
        labels[label] = index;
      }
    });

    while (pc < lines.length) {
      let line = lines[pc];
      if (line.endsWith(":")) {
        pc++;
        continue; // Skip label definitions
      }

      const parts = line.split(/\s+/);
      const instr = parts[0].toUpperCase();
      const arg = parts[1];

      switch (instr) {
        case "PUSH": {
          let value = 0;
          if (arg?.startsWith("0x")) {
            value = parseInt(arg, 16);
          } else if (arg?.startsWith("$")) {
            value = parseInt(arg.slice(1), 16);
          } else {
            value = Number(arg);
          }
          stack.push(value);
          break;
        }
        case "ADD": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a + b);
          break;
        }
        case "SUB": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a - b);
          break;
        }
        case "MUL": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a * b);
          break;
        }
        case "DIV": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(Math.floor(a / b));
          break;
        }
        case "MOD": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(a % b);
          break;
        }
        case "PRINT":
          console.log("[OpcodeSim] Stack:", JSON.stringify(stack));
          break;
        case "DUP":
          stack.push(stack[stack.length - 1]);
          break;
        case "SWAP": {
          const b = stack.pop();
          const a = stack.pop();
          stack.push(b);
          stack.push(a);
          break;
        }
        case "JMP": {
          const target = labels[arg?.toUpperCase()];
          if (target !== undefined) {
            pc = target;
            continue;
          }
          break;
        }
        case "IFZERO": {
          const condition = stack.pop();
          const target = labels[arg?.toUpperCase()];
          if (condition === 0 && target !== undefined) {
            pc = target;
            continue;
          }
          break;
        }
        case "IFNZERO": {
          const condition = stack.pop();
          const target = labels[arg?.toUpperCase()];
          if (condition !== 0 && target !== undefined) {
            pc = target;
            continue;
          }
          break;
        }
        default:
          console.warn(`[OpcodeSim] Unknown opcode: ${instr}`);
      }

      pc++;
    }

    if (outputVarId > 0) {
      const result = stack.length > 0 ? stack[stack.length - 1] : 0;
      $gameVariables.setValue(outputVarId, result);
    }
  });

  PluginManager.registerCommand(PLUGIN_NAME, "DisassembleOpcode", args => {
    const programText = args.Program || "";
    const outputVarId = Number(args.OutputVar || 0);
    const lines = programText.split(/\n|,/).map(l => l.trim()).filter(l => l);
    let disassembly = "";

    lines.forEach((line, index) => {
      if (line.endsWith(":")) {
        disassembly += `\n[${index}] ${line}`;
      } else {
        const parts = line.split(/\s+/);
        const instr = parts[0].toUpperCase();
        const arg = parts[1] || "";
        const displayArg = (instr === "PUSH" && !isNaN(parseInt(arg))) ? `0x${parseInt(arg).toString(16).toUpperCase()}` : arg;
        disassembly += `\n[${index}] ${instr.padEnd(8)} ${displayArg}`;
      }
    });

    if (outputVarId > 0) {
      $gameVariables.setValue(outputVarId, disassembly.trim());
    }
  });
})();