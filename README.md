Plugins created specifically for RPGMaker MZ:

Place Plugin JS file in your RPGMaker MZ game project folder, under subfolders \js\plugins

For Vigenère cipher Usage encode your Clear-text message using Vigenère then output to Base64.
  I suggest using CyberChef: https://gchq.github.io/CyberChef/

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/vigenere-recipe.png "Vigenere CyberChef Recipe")

Next, configure which variable you want to use to store the decode key:

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/vigenereplugin.png "Vigenere Plugin Manager")

Now create a text event in game with your encoded text. Use this format: \\VDECR[base64]

![alt text](https://raw.githubusercontent.com/securitymagic/rpgmakermz/main/images/vigenere-use.png "Vigenere Usage Example")
