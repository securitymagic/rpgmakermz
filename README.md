Plugins created specifically for RPGMaker MZ: [Example Video:](https://youtu.be/uT13-NyckQg)

Place Plugin JS file in your RPGMaker MZ game project folder, under subfolders \js\plugins

## Vigenère Plugin

For Vigenère cipher Usage encode your Clear-text message using Vigenère then output to Base64.
  I suggest using CyberChef: https://gchq.github.io/CyberChef/

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/vigenere-recipe.png "Vigenere CyberChef Recipe")

Next, configure which variable you want to use to store the decode key:

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/vigenereplugin.png "Vigenere Plugin Manager")

Now create a text event in game with your encoded text. Use this format: \\\\VDECR[base64]

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/vigenere-use.png "Vigenere Usage Example")

## RC4 Plugin

To use RC4 Plugin the steps are similar. THe format for RC4 is \\\\DECR[base64]:

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/rc4-recipe.png "RC4 CyberChef Recipe")
![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/rc4plugin.png "RC4 Plugin Manager")
![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/rc4-use.png "RC4 Usage Example")

A game that is currently using these plugins can be found at: [CTF-2024 RPG](https://lukeacha.itch.io/capture-the-flag-2024)

## Book Cipher Decode:

This plugin allows to to have a simple flat text file placed in your data folder which can be read as a book cipher. 
For example: cipher1.txt in the Data folder might read "This is great!"
-Default Control Variable for specifying the Book Cipher to use is 44, so you can change which book to use at any point in the game

Load the cipher in-ggame by setting control variable 44 to "cipher1" or whatever you named your text file (do not include .txt in the variable text)
(I suggest creating a "LOADING" scene where you set the variable ahead of time and then just set a text message \\\\BOOKDECR[0] )
Now, in the text message box in-game use \\\\BOOKDECR[0, 1, 2, 3] this should output "This"

-Additional feature: Control Variable 45 (default) is set for ROT cipher, default ROT is 0 (no change to text). However you can set rotation to further complicate the book cipher. If Varibale 45 is set to "1" your output from the example would eb Uijt.

## OpcodeSimulator:

 -Create puzzles around understanding Opcode. In this example, the user must understand opcode operation to match the input value to the expected output value. 
 -There are 2 parts to this plugin. The first "Disassemble Program" stores the program in a variable that can then be displayed in Text event to the user. The second "Run Opcode Program" runs the opcode and stores the result in a variable.

 ![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/opcode1.png "Opcode setup")
 ![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/opcode2.png "Opcode Event")
 

## Virtual Debugger Plugin:


This robust plugin offers a few ways to make cyber security challenges within RPGMaker MZ.
  - This first example shows "Disassemble Debugger Program" to store the program in a variable which can be displayed to the user in text.
  - Next the user is prompted for Input to make it so that the EAX register value in decimal matches EBX from HEX. The "Patch Register" function is used here to change EAX to the Input value stored in the input Variable.
  - Now "Run Debugger Program" runs the patched code, notice ECX is used here, this is to generate a 1 or 0 "True or False". Use this in a coditional branch for the puzzle.

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/patch.png "Patch Register Event")


  ## DebuggerUIPatcher

  Works with the VirtualDebugger, this plugin shows a window of the instructions set by the developer where the player can set NOP (No Operations) in the debugger to modify/patch the program to get the proper result. The patched program is store in a variable 
  and then used by VirtualDebugger function (Run Debugger From Variable). The Output results, stored in a separate variable can be used for various puzzles, the output could be right or wrong value depending on the player, this value then can be used in an input.

  ![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/debug1.png "Player View of Debugger")
  ![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/debug2.png "Debugger Setup")
  ![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/debug3.png "Debugger Event")
