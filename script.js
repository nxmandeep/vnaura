const START_BALANCE = 10000;
const $ = (id) => document.getElementById(id);
let balance = START_BALANCE, rounds = 0, totalWon = 0, history = [];
let game = "slots", bj = null, crash = null, crashTimer = null;
const symbols = ["🍒","🍋","🍇","🔔","⭐","7️⃣"];
const suits = ["♠","♥","♦","♣"];
const names = {slots:"Lucky Slots",roulette:"Roulette",blackjack:"Blackjack",poker:"Five-card draw",dice:"Dice",crash:"Sky Multiplier"};
const gameNumbers = {slots:"01",roulette:"02",blackjack:"03",poker:"04",dice:"05",crash:"06"};
const fmt = n => Math.floor(n).toLocaleString("en-US");
function setResult(msg,kind=""){ $("result").textContent=msg; $("result").className="result "+kind; }
function update(){
  $("balance").textContent=fmt(balance); $("rounds").textContent=fmt(rounds); $("won").textContent=fmt(totalWon);
  $("history").innerHTML=history.length ? history.slice(0,8).map(h=>`<div class="history-row"><span>${h.game}</span><span>${h.detail}</span><span class="${h.delta>=0?'positive':'negative'}">${h.delta>=0?'+':''}${fmt(h.delta)} coins</span></div>`).join("") : '<p class="subtle">Your demo rounds will appear here.</p>';
}
function log(detail,delta){rounds++; if(delta>0)totalWon+=delta; history.unshift({game:names[game],detail,delta}); update();}
function amount(){const el=$("bet"); let n=Number(el?.value); if(!Number.isFinite(n)||n<1||!Number.isInteger(n)){setResult("Enter a whole-number coin amount of at least 1.","bad");return null;} if(n>balance){setResult("Not enough virtual coins. Reset the demo to start over.","bad");return null;} return n;}
function spend(n){balance-=n;update();}
function earn(n){balance+=n;update();}
function controls(extra=""){return `<div class="control-row"><label class="field">VIRTUAL COINS<input id="bet" type="number" min="1" step="1" max="${balance}" value="${Math.min(100,Math.max(1,balance))}"></label>${extra}</div>`;}
function board(inner){$("gameContent").innerHTML=`<div class="game-board">${inner}</div>`;}
function selectGame(next){
  if(crashTimer){clearInterval(crashTimer);crashTimer=null;} game=next; bj=null; crash=null;
  document.querySelectorAll(".game-card").forEach(b=>b.classList.toggle("active",b.dataset.game===game));
  $("gameTitle").textContent=names[game];$("gameEyebrow").textContent="GAME "+gameNumbers[game];
  setResult("Choose your virtual-coin amount and play a round.");
  renderGame();
}
function renderGame(){
  if(game==="slots") board(`<div class="reels" id="reels"><div class="reel">🍒</div><div class="reel">⭐</div><div class="reel">7️⃣</div></div>${controls('<button class="action-btn" id="play">SPIN REELS</button>')}`);
  if(game==="roulette") board(`<div class="roulette-ball" id="rouletteNum">?</div><label class="field">PICK A BET<select id="roulettePick"><option value="red">Red</option><option value="black">Black</option><option value="even">Even</option><option value="odd">Odd</option></select></label>${controls('<button class="action-btn" id="play">SPIN WHEEL</button>')}`);
  if(game==="blackjack") {bj=null; board(`<div class="subtle" id="bjStatus">Draw cards and try to get closer to 21 than the dealer.</div><div class="cards" id="playerCards"></div><div class="subtle" id="dealerLabel">Dealer</div><div class="cards" id="dealerCards"></div>${controls('<button class="action-btn" id="deal">DEAL</button>')}`);}
  if(game==="poker") board(`<div class="subtle">Five-card draw · one simulated round</div><div class="cards" id="pokerCards"></div>${controls('<button class="action-btn" id="play">DRAW HAND</button>')}`);
  if(game==="dice") board(`<div class="dice-row" id="diceRow"><div class="reel">⚄</div></div><label class="field">YOUR GUESS<select id="dicePick"><option value="high">High (4–6)</option><option value="low">Low (1–3)</option></select></label>${controls('<button class="action-btn" id="play">ROLL DICE</button>')}`);
  if(game==="crash") board(`<div class="multiplier" id="multiplier">1.00×</div><div class="subtle" id="crashStatus">Start a round and collect your virtual winnings before the simulated crash.</div>${controls('<button class="action-btn" id="crashStart">START ROUND</button><button class="secondary-btn" id="cashOut" disabled>COLLECT</button>')}`);
  bindGame();
}
function bindGame(){
  if($("play")) $("play").addEventListener("click",playRound);
  if($("deal")) $("deal").addEventListener("click",dealBlackjack);
  if($("crashStart")) $("crashStart").addEventListener("click",startCrash);
  if($("cashOut")) $("cashOut").addEventListener("click",cashOut);
}
function playRound(){
  const bet=amount(); if(bet===null)return;
  if(game==="slots"){
    spend(bet); const vals=Array.from({length:3},()=>symbols[Math.floor(Math.random()*symbols.length)]);
    $("reels").innerHTML=vals.map(s=>`<div class="reel">${s}</div>`).join("");
    let mult=0;if(vals.every(s=>s===vals[0]))mult=vals[0]==="7️⃣"?8:5;else if(new Set(vals).size===2)mult=1.5;
    const payout=Math.floor(bet*mult); if(payout)earn(payout); const delta=payout-bet;
    setResult(payout?`You received ${fmt(payout)} virtual coins (${mult}×).`:`No match this time. Try another demo spin.` ,payout?"good":"bad");log(vals.join(" "),delta);
  } else if(game==="roulette"){
    const pick=$("roulettePick").value; spend(bet); const n=Math.floor(Math.random()*37); const color=n===0?"green":n%2?"red":"black";
    $("rouletteNum").textContent=n; $("rouletteNum").style.color=color==="red"?"#ff7788":color==="black"?"white":"#61e2ac";
    const win=(pick===color)||(pick==="even"&&n!==0&&n%2===0)||(pick==="odd"&&n%2===1);
    const payout=win?bet*2:0;if(payout)earn(payout);setResult(`Number ${n} (${color}). ${win?`You received ${fmt(payout)} virtual coins.`:"No win this round."}`,win?"good":"bad");log(`${pick} · ${n} ${color}`,payout-bet);
  } else if(game==="dice"){
    const pick=$("dicePick").value;spend(bet);const n=1+Math.floor(Math.random()*6);$("diceRow").innerHTML=`<div class="reel">${["⚀","⚁","⚂","⚃","⚄","⚅"][n-1]}</div><strong>${n}</strong>`;
    const win=(pick==="high"&&n>=4)||(pick==="low"&&n<=3);const payout=win?bet*2:0;if(payout)earn(payout);setResult(`You rolled ${n}. ${win?`You received ${fmt(payout)} virtual coins.`:"No win this round."}`,win?"good":"bad");log(`Roll ${n} · ${pick}`,payout-bet);
  } else if(game==="poker"){
    spend(bet);const deck=makeDeck();shuffle(deck);const hand=deck.slice(0,5);$("pokerCards").innerHTML=hand.map(cardHTML).join("");
    const counts={};hand.forEach(c=>counts[c.v]=(counts[c.v]||0)+1);const vals=Object.values(counts);let mult=0;
    if(vals.includes(4))mult=8;else if(vals.includes(3)&&vals.includes(2))mult=5;else if(vals.includes(3))mult=3;else if(vals.filter(v=>v===2).length===2)mult=2;else if(vals.includes(2))mult=1.5;
    const payout=Math.floor(bet*mult);if(payout)earn(payout);setResult(`${pokerRank(vals)}${payout?` — received ${fmt(payout)} virtual coins.`:" — no matching hand this time."}`,payout?"good":"bad");log("Five-card draw",payout-bet);
  }
}
function cardHTML(c){return `<div class="playing-card ${c.s==="♥"||c.s==="♦"?"red":""}"><span>${c.v}${c.s}</span><span class="center">${c.s}</span><span>${c.v}</span></div>`}
function makeDeck(){const vals=["A","2","3","4","5","6","7","8","9","10","J","Q","K"];return suits.flatMap(s=>vals.map(v=>({s,v})))}
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a}
function pokerRank(vals){if(vals.includes(4))return "Four of a kind";if(vals.includes(3)&&vals.includes(2))return "Full house";if(vals.includes(3))return "Three of a kind";if(vals.filter(v=>v===2).length===2)return "Two pair";if(vals.includes(2))return "One pair";return "High card"}
function cardValue(c){if(c.v==="A")return 11;if(["K","Q","J"].includes(c.v))return 10;return Number(c.v)}
function handValue(hand){let n=hand.reduce((s,c)=>s+cardValue(c),0),aces=hand.filter(c=>c.v==="A").length;while(n>21&&aces>0){n-=10;aces--;}return n}
function dealBlackjack(){
  if(bj){setResult("This hand is finished. Switch games or select Blackjack again for a new hand.");return}
  const bet=amount();if(bet===null)return;spend(bet);const deck=shuffle(makeDeck());bj={bet,deck,player:[deck.pop(),deck.pop()],dealer:[deck.pop(),deck.pop()],done:false};
  showBJ(false);
  const row=$("gameContent").querySelector(".control-row");
  row.innerHTML='<button class="action-btn" id="hit">HIT</button><button class="secondary-btn" id="stand">STAND</button>';
  $("hit").onclick=()=>{if(!bj||bj.done)return;bj.player.push(bj.deck.pop());showBJ(false);if(handValue(bj.player)>21)finishBJ();};
  $("stand").onclick=()=>{if(!bj||bj.done)return;while(handValue(bj.dealer)<17)bj.dealer.push(bj.deck.pop());finishBJ();};
  setResult("Your turn: hit or stand.");
}
function showBJ(reveal){$("playerCards").innerHTML=bj.player.map(cardHTML).join("");$("dealerCards").innerHTML=reveal?bj.dealer.map(cardHTML).join(""):cardHTML(bj.dealer[0])+'<div class="playing-card">🂠</div>';$("bjStatus").textContent=`Your total: ${handValue(bj.player)}${reveal?` · Dealer total: ${handValue(bj.dealer)}`:""}`;}
function finishBJ(){
  if(!bj||bj.done)return;bj.done=true;showBJ(true);const p=handValue(bj.player),d=handValue(bj.dealer);let payout=0,msg="";
  if(p>21)msg="Bust — dealer wins.";else if(d>21||p>d){payout=bj.bet*2;msg="You win!";}else if(p===d){payout=bj.bet;msg="Push — your virtual coins are returned.";}else msg="Dealer wins.";
  if(payout)earn(payout);setResult(`${msg} Your total: ${p}, dealer: ${d}. ${payout?`Payout: ${fmt(payout)} virtual coins.`:""}`,payout>bj.bet?"good":payout===bj.bet?"":"bad");log(`Player ${p} · Dealer ${d}`,payout-bj.bet);
  const row=$("gameContent").querySelector(".control-row");row.innerHTML='<button class="action-btn" id="deal">NEW HAND</button>'; $("deal").onclick=()=>{bj=null;renderGame();setResult("Choose your virtual-coin amount and play a round.");};
}
function startCrash(){
  const bet=amount();if(bet===null)return;if(crashTimer){clearInterval(crashTimer);clearInterval(crashTimer);crashTimer=null;}
  spend(bet);const bustAt=1.05+Math.random()*4.5;crash={bet,mult:1,bustAt,active:true};$("crashStart").disabled=true;$("cashOut").disabled=false;$("crashStatus").textContent="Multiplier rising… collect before the simulated crash.";
  crashTimer=setInterval(()=>{if(!crash||!crash.active)return;crash.mult+=0.04+crash.mult*0.018;$("multiplier").textContent=crash.mult.toFixed(2)+"×";if(crash.mult>=crash.bustAt){clearInterval(crashTimer);crashTimer=null;crash.active=false;$("cashOut").disabled=true;$("crashStart").disabled=false;$("crashStatus").textContent=`Crashed at ${crash.mult.toFixed(2)}×.`;setResult("The simulated round crashed. Your virtual coins were used for this round.","bad");log(`Crash at ${crash.mult.toFixed(2)}×`, -crash.bet);crash=null;}},120);
}
function cashOut(){
  if(!crash||!crash.active)return;const payout=Math.floor(crash.bet*crash.mult);const mult=crash.mult;crash.active=false;if(crashTimer){clearInterval(crashTimer);crashTimer=null;}earn(payout);$("cashOut").disabled=true;$("crashStart").disabled=false;$("crashStatus").textContent=`Collected at ${mult.toFixed(2)}×.`;setResult(`Collected ${fmt(payout)} virtual coins at ${mult.toFixed(2)}×.`, "good");log(`Collected at ${mult.toFixed(2)}×`,payout-crash.bet);crash=null;
}
document.querySelectorAll(".game-card").forEach(b=>b.addEventListener("click",()=>selectGame(b.dataset.game)));
$("resetBtn").addEventListener("click",()=>{if(crashTimer){clearInterval(crashTimer);crashTimer=null;}balance=START_BALANCE;rounds=0;totalWon=0;history=[];bj=null;crash=null;update();selectGame("slots");setResult("Demo reset. You have 10,000 virtual coins.");});
$("clearHistory").addEventListener("click",()=>{history=[];update();});
selectGame("slots");update();