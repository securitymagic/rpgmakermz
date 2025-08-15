/*:
 * @target MZ
 * @plugindesc High Card (Player vs 3 AI) with geeky mixed-number cards (DEC/HEX/OCT/BIN/ROM). Betting included. v1.0
 * @author Luke Acha and ChatGPT
 *
 * @help CyberHighCard_MZ.js
 *
 * A lightweight High Card minigame for RPG Maker MZ.
 * - Player faces 3 AI opponents. Highest numeric card wins the pot.
 * - Cards are displayed as mixed formats: Decimal, Hex (0x..), Octal (0o..), Binary (0b..), and optional Roman numerals.
 * - Simple betting: player chooses their wager; pot = 4 × bet. If player wins, they gain the full pot. If not, they lose only their bet.
 * - Tie handling: up to 2 re-deals among tied leaders; after that, the tied leaders split the pot (player receives their share if included).
 * - Plugin command to launch the game from events.
 *
 * Quality-of-life:
 * - Clean UI windows (Gold/Pot, Bet, Actions, Log, Cards).
 * - Animations are minimal for stability; feel free to add SFX/flash.
 *
 * Terms of Use: Free for commercial and non-commercial use. Credit appreciated.
 *
 * @param MinBet
 * @text Minimum Bet
 * @type number
 * @min 1
 * @default 100
 * @desc Minimum wager amount.
 *
 * @param MaxBet
 * @text Maximum Bet
 * @type number
 * @min 1
 * @default 1000
 * @desc Maximum wager amount offered in the bet selector.
 *
 * @param BetStep
 * @text Bet Step
 * @type number
 * @min 1
 * @default 100
 * @desc Increment when changing the bet.
 *
 * @param AllowBinary
 * @text Include Binary Cards (0b..)
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 *
 * @param AllowRoman
 * @text Include Roman Numeral Cards
 * @type boolean
 * @on Yes
 * @off No
 * @default true
 *
 * @param MaxCardValue
 * @text Highest Base Value
 * @type number
 * @min 5
 * @max 100
 * @default 20
 * @desc The largest numeric value used when building the deck (1..N).
 *
 * @param RoundsPerSession
 * @text Rounds Per Session
 * @type number
 * @min 1
 * @default 1
 * @desc Play this many rounds before auto-exiting back to map. Set 0 for endless until Exit.
 *
 * @param OpponentNames
 * @text Opponent Names (3)
 * @type string[]
 * @default ["TRACE","HEAP","STACK"]
 * @desc Names shown for the three AI opponents.
 *
 * @command StartHighCard
 * @text Start: Cyber High Card
 * @desc Launch the High Card minigame scene.
 */
(function(){
  'use strict';

  const PLUGIN_NAME = 'CyberHighCard_MZ';
  const params = PluginManager.parameters('CyberHighCard_MZ');

  const MIN_BET = Number(params.MinBet || 100);
  const MAX_BET = Number(params.MaxBet || 1000);
  const BET_STEP = Number(params.BetStep || 100);
  const ALLOW_BIN = String(params.AllowBinary || 'true') === 'true';
  const ALLOW_ROMAN = String(params.AllowRoman || 'true') === 'true';
  const MAX_VAL = Math.max(5, Number(params.MaxCardValue || 20));
  const ROUNDS_PER = Math.max(0, Number(params.RoundsPerSession || 1));
  const OPP_NAMES = (()=>{ try { return JSON.parse(params.OpponentNames || '["TRACE","HEAP","STACK"]'); } catch(_) { return ["TRACE","HEAP","STACK"]; } })();

  PluginManager.registerCommand(PLUGIN_NAME, 'StartHighCard', () => {
    SceneManager.push(Scene_CyberHighCard);
  });

  function shuffle(a){ for(let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

  const Roman = {
    toRoman(n){
      if(n<=0||n>=4000) return String(n);
      const map=[[1000,'M'],[900,'CM'],[500,'D'],[400,'CD'],[100,'C'],[90,'XC'],[50,'L'],[40,'XL'],[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']];
      let out=''; for(const [v,s] of map){ while(n>=v){ out+=s; n-=v; } } return out;
    }
  };

  function buildDeck(){
    const deck=[];
    for(let x=1;x<=MAX_VAL;x++){
      deck.push({label:String(x), value:x, kind:'DEC'});
      deck.push({label:'0x'+x.toString(16).toUpperCase(), value:x, kind:'HEX'});
      deck.push({label:'0o'+x.toString(8), value:x, kind:'OCT'});
      if(ALLOW_BIN) deck.push({label:'0b'+x.toString(2), value:x, kind:'BIN'});
      if(ALLOW_ROMAN) deck.push({label:Roman.toRoman(x), value:x, kind:'ROM'});
    }
    return shuffle(deck);
  }

  class Window_CH_Top extends Window_Base {
    initialize(rect){ super.initialize(rect); this._gold=0; this._bet=MIN_BET; this._pot=0; this.refresh(); }
    setInfo(g,b,p){ if(this._gold!==g||this._bet!==b||this._pot!==p){ this._gold=g; this._bet=b; this._pot=p; this.refresh(); } }
    refresh(){ this.contents.clear(); const lh=this.lineHeight();
      this.drawText('Cyber High Card',0,0,this.innerWidth,'left');
      this.drawText(`Gold: ${$gameParty.gold()}`,0,lh,this.innerWidth/2,'left');
      this.drawText(`Bet: ${this._bet}`,this.innerWidth/2,lh,this.innerWidth/2,'right');
      this.drawText(`Pot: ${this._pot}`,0,lh*2,this.innerWidth,'left'); }
  }

class Window_CH_Bet extends Window_Command {
  initialize(rect){
    this._bet = Math.min(Math.max(MIN_BET, BET_STEP * Math.max(1, Math.floor(MIN_BET / BET_STEP))), MAX_BET);
    super.initialize(rect);
  }
  maxCols(){ return 3; }
  makeCommandList(){
    this.addCommand('-' + BET_STEP, 'dec');
    this.addCommand('Deal', 'deal');
    this.addCommand('+' + BET_STEP, 'inc');
    this.addCommand('Min', 'min');
    this.addCommand('Exit', 'exit');
    this.addCommand('Max', 'max');
  }
  currentBet(){ return this._bet; }
  increase(){ this._bet = Math.min(MAX_BET, this._bet + BET_STEP); this.playOkSound(); Window_Command.prototype.refresh.call(this); this.activate(); }
  decrease(){ this._bet = Math.max(MIN_BET, this._bet - BET_STEP); this.playOkSound(); Window_Command.prototype.refresh.call(this); this.activate(); }
  setMin(){ this._bet = MIN_BET; this.playOkSound(); Window_Command.prototype.refresh.call(this); this.activate(); }
  setMax(){ this._bet = MAX_BET; this.playOkSound(); Window_Command.prototype.refresh.call(this); this.activate(); }
  refresh(){ Window_Command.prototype.refresh.call(this); /* no Bet text drawn here */ }
}


  class Window_CH_Log extends Window_Base {
    initialize(rect){ super.initialize(rect); this._lines=[]; this.refresh(); }
    push(t){ this._lines.push(t); if(this._lines.length>6) this._lines.shift(); this.refresh(); }
    clearLog(){ this._lines.length=0; this.refresh(); }
    refresh(){ this.contents.clear(); const lh=this.lineHeight(); this.drawText('Log',0,0,this.innerWidth,'left'); for(let i=0;i<this._lines.length;i++){ this.drawText(this._lines[i],0,(i+1)*lh,this.innerWidth,'left'); } }
  }

  class Window_CH_Cards extends Window_Base {
    initialize(rect){ super.initialize(rect); this._names=['You',...OPP_NAMES]; this._cards=[]; this._revealed=false; this.refresh(); }
    setRound(names,cards,revealed){ this._names=names||this._names; this._cards=cards||[]; this._revealed=!!revealed; this.refresh(); }
    refresh(){ this.contents.clear(); const lh=this.lineHeight(); for(let i=0;i<4;i++){ const y=i*lh*1.4; const name=this._names[i]||`P${i}`; this.drawText(name,0,y,this.innerWidth/3,'left'); const card=this._cards[i]; const label=card?(this._revealed?card.label:'???'):'-'; this.drawText(label,this.innerWidth/3,y,this.innerWidth*2/3,'left'); } }
  }

  class Window_CH_PostRound extends Window_Command {
    initialize(rect){ super.initialize(rect); }
    makeCommandList(){ this.addCommand('Play Again','again'); this.addCommand('Change Bet','bet'); this.addCommand('Exit','exit'); }
  }

  class Scene_CyberHighCard extends Scene_MenuBase {
    create(){ super.create(); this._roundsPlayed=0; this._deck=buildDeck(); this._revealing=false; this._showPostAfterDelay=false; this.createWindows(); this.refreshTop(); }
    createWindows(){
      const m=12;
      const topRect=new Rectangle(m,m,Graphics.boxWidth-m*2,this.calcWindowHeight(3,true)); this._topWindow=new Window_CH_Top(topRect); this.addWindow(this._topWindow);
      const cardsRect=new Rectangle(m,topRect.y+topRect.height+m,Graphics.boxWidth-m*2,this.calcWindowHeight(5, true)); this._cardsWindow=new Window_CH_Cards(cardsRect); this.addWindow(this._cardsWindow);
      const logRect=new Rectangle(m,cardsRect.y+cardsRect.height+m,Graphics.boxWidth*0.6-m*2,this.calcWindowHeight(7,true)); this._logWindow=new Window_CH_Log(logRect); this.addWindow(this._logWindow);
      const betRect=new Rectangle(Graphics.boxWidth*0.6,cardsRect.y+cardsRect.height+m,Graphics.boxWidth*0.4-m*2,this.calcWindowHeight(7,true)); this._betWindow=new Window_CH_Bet(betRect); this.addWindow(this._betWindow);

      this._betWindow.setHandler('deal',this.onDeal.bind(this));
      this._betWindow.setHandler('inc',()=>{ this._betWindow.increase(); this.refreshTop(); });
      this._betWindow.setHandler('dec',()=>{ this._betWindow.decrease(); this.refreshTop(); });
      this._betWindow.setHandler('min',()=>{ this._betWindow.setMin(); this.refreshTop(); });
      this._betWindow.setHandler('max',()=>{ this._betWindow.setMax(); this.refreshTop(); });
      this._betWindow.setHandler('exit',()=>{ this.popScene(); });

      const prW=Math.floor(Graphics.boxWidth*0.5), prH=this.calcWindowHeight(4,true);
      const prX=Math.floor((Graphics.boxWidth-prW)/2), prY=Math.floor((Graphics.boxHeight-prH)/2);
      const prRect=new Rectangle(prX,prY,prW,prH);
      this._postWindow=new Window_CH_PostRound(prRect);
      this._postWindow.hide(); this._postWindow.deactivate();
      this._postWindow.setHandler('again',()=>{ this._postWindow.deactivate(); this._postWindow.hide(); this._logWindow.push('New round...'); this.onDeal(); });
      this._postWindow.setHandler('bet',()=>{ this._postWindow.deactivate(); this._postWindow.hide(); this._logWindow.push('Adjust your bet.'); this._betWindow.activate(); });
      this._postWindow.setHandler('exit',()=>{ this.popScene(); });
      this.addWindow(this._postWindow);

      this._cardsWindow.setRound(['You',...OPP_NAMES],[null,null,null,null],false);
      this._logWindow.push('Choose your bet, then Deal.');
      this._betWindow.activate();
    }

    refreshTop(){ const bet=this._betWindow.currentBet(); this._topWindow.setInfo($gameParty.gold(),bet,bet*4); }

    onDeal(){
      const bet=this._betWindow.currentBet();
      if($gameParty.gold()<bet){ AudioManager.playSe($dataSystem.sounds[9]); this._logWindow.push('Not enough gold for that bet.'); return; }
      $gameParty.loseGold(bet); const pot=bet*4; this._topWindow.setInfo($gameParty.gold(),bet,pot); this._logWindow.clearLog();
      if(this._deck.length<16){ this._deck=buildDeck(); this._logWindow.push('Shuffling a fresh deck...'); }
      const drawn=[this._deck.pop(),this._deck.pop(),this._deck.pop(),this._deck.pop()];
      this._cardsWindow.setRound(['You',...OPP_NAMES],drawn,false);
      this._logWindow.push('Cards dealt. Revealing...');
      this.startReveal(drawn,bet,pot);
    }

    startReveal(drawn,bet,pot){ this._revealFrames=24; this._revealPayload={drawn,bet,pot}; this._revealing=true; }

    update(){ super.update(); this.updateReveal(); this.updatePostRoundDelay(); }

    updateReveal(){
      if(!this._revealing) return;
      if(--this._revealFrames<=0){
        this._revealing=false;
        const {drawn,bet,pot}=this._revealPayload;
        this._cardsWindow.setRound(['You',...OPP_NAMES],drawn,true);
        this.resolveRound(drawn,bet,pot);
      }
    }

    resolveRound(cards,bet,pot){
      const values=cards.map(c=>c.value), maxVal=Math.max(...values);
      let leaders=[]; for(let i=0;i<values.length;i++){ if(values[i]===maxVal) leaders.push(i); }
      let t=0; while(leaders.length>1 && t<2){ t++; this._logWindow.push(`Tie on ${maxVal}. Tiebreak #${t}...`); const newCards=cards.slice(); for(const idx of leaders){ newCards[idx]=this._deck.pop(); } cards=newCards; this._cardsWindow.setRound(['You',...OPP_NAMES],cards,true); const vals=leaders.map(i=>cards[i].value); const newMax=Math.max(...vals); leaders=leaders.filter(i=>cards[i].value===newMax); }
      if(leaders.length===1){ const w=leaders[0]; if(w===0){ $gameParty.gainGold(pot); AudioManager.playSe($dataSystem.sounds[3]); this._logWindow.push(`You win! +${pot}g`); } else { AudioManager.playSe($dataSystem.sounds[4]); const name=OPP_NAMES[w-1]||`Opp${w}`; this._logWindow.push(`${name} wins. You lost ${bet}g.`); } }
      else { const each=Math.floor(pot/leaders.length); if(leaders.includes(0)){ $gameParty.gainGold(each); AudioManager.playSe($dataSystem.sounds[10]); this._logWindow.push(`Split pot among ${leaders.length}. You receive ${each}g.`); } else { AudioManager.playSe($dataSystem.sounds[4]); this._logWindow.push(`Split pot among opponents. You lost ${bet}g.`); } }
      this._roundsPlayed++; this._topWindow.setInfo($gameParty.gold(),this._betWindow.currentBet(),this._betWindow.currentBet()*4);

      // DO NOT auto-exit. Instead, delay then show post-round menu.
      this._postDelayFrames = 180; // ~1s
      this._showPostAfterDelay = true;
      if(ROUNDS_PER>0 && this._roundsPlayed>=ROUNDS_PER){ this._logWindow.push('Session complete.'); }
      else { this._logWindow.push('Round complete.'); }
    }

    updatePostRoundDelay(){
      if(this._showPostAfterDelay){
        if(--this._postDelayFrames<=0){
          this._showPostAfterDelay=false;
          this._postWindow.show(); this._postWindow.activate(); this._postWindow.select(0);
        }
      }
    }
  }

})();
