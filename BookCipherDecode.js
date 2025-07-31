/*:
 * @target MZ
 * @plugindesc Book cipher decryption via \BOOKDECR[] using external text file and optional variable for alternate books and rot cipher. v1.1-bookcipher-rot
 * @author Luke Acha + ChatGPT
 *
 * @param BookVariableID
 * @text Book Name Variable ID
 * @desc Variable ID that contains the current book file name (without .txt)
 * @type variable
 * @default 44
 *
 * @param RotVariableID
 * @text ROT Amount Variable ID
 * @desc Variable ID that contains the numeric ROT shift (e.g. 0 for no shift, 13 for ROT13)
 * @type variable
 * @default 45
 */

(() => {
  const PLUGIN_NAME = "BookCipherDecode";
  const params = PluginManager.parameters(PLUGIN_NAME);
  const BOOK_VAR_ID = Number(params["BookVariableID"] || 0);
  const ROT_VAR_ID = Number(params["RotVariableID"] || 0);

  let _bookCache = {};

  function getCurrentBookFilename() {
    const varVal = $gameVariables.value(BOOK_VAR_ID);
    if (typeof varVal !== "string" || !varVal.trim()) return null;
    return `data/${varVal.trim()}.txt`;
  }

  function getCurrentRotAmount() {
    const rot = $gameVariables.value(ROT_VAR_ID);
    return typeof rot === "number" ? rot : 0;
  }

  function loadBookText(path, onSuccess, onError) {
    if (_bookCache[path]) return onSuccess(_bookCache[path]);

    const xhr = new XMLHttpRequest();
    xhr.open("GET", path);
    xhr.overrideMimeType("text/plain");
    xhr.onload = () => {
      if (xhr.status < 400) {
        _bookCache[path] = xhr.responseText;
        onSuccess(xhr.responseText);
      } else {
        onError();
      }
    };
    xhr.onerror = onError;
    xhr.send();
  }

  function applyROT(char, rot) {
    const code = char.charCodeAt(0);
    if (code >= 65 && code <= 90) {
      return String.fromCharCode(((code - 65 + rot) % 26) + 65);
    } else if (code >= 97 && code <= 122) {
      return String.fromCharCode(((code - 97 + rot) % 26) + 97);
    } else {
      return char;
    }
  }

  function bookDecrypt(positionsStr, bookText, rot) {
    const positions = positionsStr.split(/[,\s]+/).map(p => parseInt(p.trim()));
    let output = "";
    for (const pos of positions) {
      if (!isNaN(pos) && pos >= 0 && pos < bookText.length) {
        const originalChar = bookText.charAt(pos);
        output += applyROT(originalChar, rot);
      } else {
        output += "?";
      }
    }
    return output;
  }

  const _convertEscapeCharacters = Window_Base.prototype.convertEscapeCharacters;
  Window_Base.prototype.convertEscapeCharacters = function (text) {
    text = _convertEscapeCharacters.call(this, text);
    return text.replace(/\\BOOKDECR\[(.+?)\]/gi, (_, posList) => {
      const bookPath = getCurrentBookFilename();
      const rotAmount = getCurrentRotAmount();
      if (!bookPath) return posList;
      let result = posList;

      loadBookText(bookPath, (bookText) => {
        const decrypted = bookDecrypt(posList, bookText, rotAmount);
        result = decrypted;
      }, () => {
        result = "[CIPHER_BOOK_LOAD_FAIL]";
      });

      return result;
    });
  };
})();
