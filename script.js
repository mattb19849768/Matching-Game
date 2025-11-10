/* full memory game script with end-of-game modal */

const emojis = ["🍎","🍎","🍌","🍌","🍇","🍇","🍊","🍊","🍓","🍓","🍉","🍉","🥝","🥝","🍍","🍍","🍒","🍒","🍈","🍈","🥥","🥥","🍐","🍐","🍋","🍋","🍑","🍑","🥭","🥭","🍏","🍏"];
const cardBackImages = ["data:image1","data:image2","data:image3"];

let currentBackIndex = 0;
let firstCard = null, secondCard = null, lockBoard = false;
let score = 1000, moves = 0, matchedPairs = 0, time = 0, timerInterval = null;
let bestTime = localStorage.getItem("bestTime") ? Number(localStorage.getItem("bestTime")) : null;

const gameBoard = document.getElementById("gameBoard");
const scoreDisplay = document.getElementById("score");
const movesDisplay = document.getElementById("moves");
const timerDisplay = document.getElementById("timer");
const bestTimeDisplay = document.getElementById("bestTime");
const flipSound = document.getElementById("flipSound");
const matchSound = document.getElementById("matchSound");
const winSound = document.getElementById("winSound");
const startScreen = document.getElementById("startScreen");
const countdownOverlay = document.getElementById("countdownOverlay");
const stats = document.getElementById("stats");
const resetBtn = document.getElementById("reset");
const clearBestBtn = document.getElementById("clearBest");
const changeBackBtn = document.getElementById("changeBack");
const pairCountDropdown = document.getElementById("pairCount");
const canvas = document.getElementById("fireworksCanvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

const countdownSounds = {
  3: document.getElementById("count3"),
  2: document.getElementById("count2"),
  1: document.getElementById("count1"),
  Go: document.getElementById("countGo")
};

if(bestTime) bestTimeDisplay.textContent = bestTime + "s";

/* Safe audio play wrapper */
function safePlay(a){
  if(!a || !a.src) return;
  try { a.currentTime = 0; a.play().catch(()=>{}); } catch(e){}
}

/* Shuffle array */
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

/* Timer functions */
function startTimer() {
  clearInterval(timerInterval);
  time = 0;
  timerDisplay.textContent = time;
  timerInterval = setInterval(() => {
    time++;
    timerDisplay.textContent = time;
  }, 1000);
}

/* Create the game board */
function createBoard() {
  const pairCount = pairCountDropdown ? Number(pairCountDropdown.value) : 8;
  const usedPairs = pairCount || 8;

  const selectedEmojis = emojis.slice(0, usedPairs * 2);
  const shuffled = shuffle([...selectedEmojis]);

  gameBoard.style.display = "grid";
  if (usedPairs === 4 || usedPairs === 6) {
    const cols = Math.ceil((usedPairs*2)/2);
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(2, auto)`;
  } else if (usedPairs === 12 || usedPairs === 16) {
    const cols = Math.ceil((usedPairs*2)/4);
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(4, auto)`;
  } else {
    const cols = Math.ceil(Math.sqrt(usedPairs*2));
    const rows = Math.ceil((usedPairs*2)/cols);
    gameBoard.style.gridTemplateColumns = `repeat(${cols}, 1fr)`;
    gameBoard.style.gridTemplateRows = `repeat(${rows}, auto)`;
  }

  gameBoard.innerHTML = "";
  shuffled.forEach(emoji => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.dataset.emoji = emoji;

    const cardInner = document.createElement("div");
    cardInner.classList.add("card-inner");

    const front = document.createElement("div");
    front.classList.add("front");
    front.style.backgroundImage = `url('${cardBackImages[currentBackIndex]}')`;
    front.style.backgroundSize = "cover";
    front.style.backgroundPosition = "center";

    const back = document.createElement("div");
    back.classList.add("back");
    back.textContent = emoji;

    cardInner.appendChild(front);
    cardInner.appendChild(back);
    card.appendChild(cardInner);

    card.addEventListener("click", flipCard);
    gameBoard.appendChild(card);
  });
}

/* Card flipping logic */
function flipCard() {
  if(lockBoard || this === firstCard) return;
  this.classList.add("flipped");
  safePlay(flipSound);

  if(!firstCard) {
    firstCard = this;
    return;
  }

  secondCard = this;
  moves++;
  movesDisplay.textContent = moves;
  checkMatch();
}

/* Match checking */
function checkMatch() {
  const isMatch = firstCard.dataset.emoji === secondCard.dataset.emoji;

  if(isMatch) {
    playPartialMatchSound();
    animateMatch(firstCard);
    animateMatch(secondCard);
    addSparkles(firstCard);
    addSparkles(secondCard);
    disableCards();
    matchedPairs++;

    const pairCount = pairCountDropdown ? Number(pairCountDropdown.value) : 8;
    if(matchedPairs === pairCount) {
      clearInterval(timerInterval);
      safePlay(winSound);
      checkBestTime();
      launchFireworks();
      showEndModal({
        score,
        time,
        moves,
        bestTime
      });
    }

  } else {
    losePoints();
    unflipCards();
  }
}

/* Partial match sound */
function playPartialMatchSound() {
  matchSound.currentTime = 2;
  safePlay(matchSound);
  setTimeout(() => { matchSound.pause(); matchSound.currentTime = 0; }, 2000);
}

/* Lose points */
function losePoints() {
  score = Math.max(score - 15, 0);
  scoreDisplay.textContent = score;
}

/* Animate matched card */
function animateMatch(card) {
  const back = card.querySelector(".back");
  back.classList.add("glow");
  setTimeout(() => back.classList.remove("glow"), 1000);
}

/* Sparkle animation */
function addSparkles(card) {
  const rect = card.getBoundingClientRect();
  for(let i=0;i<6;i++){
    const s = document.createElement("div");
    s.classList.add("sparkle");
    s.style.left = `${rect.left + Math.random()*rect.width}px`;
    s.style.top = `${rect.top + Math.random()*rect.height}px`;
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),1000);
  }
}

/* Disable matched cards */
function disableCards() {
  firstCard.removeEventListener("click", flipCard);
  secondCard.removeEventListener("click", flipCard);
  resetBoard();
}

/* Unflip unmatched cards */
function unflipCards() {
  lockBoard = true;
  setTimeout(() => {
    firstCard.classList.remove("flipped");
    secondCard.classList.remove("flipped");
    resetBoard();
  }, 800);
}

/* Reset board state */
function resetBoard() { [firstCard, secondCard, lockBoard] = [null,null,false]; }

/* Best time tracking */
function checkBestTime() {
  if(!bestTime || time < bestTime){
    bestTime = time;
    localStorage.setItem("bestTime", bestTime);
    bestTimeDisplay.textContent = bestTime + "s";
  }
}

/* Countdown overlay */
function showCountdown(callback) {
  let count = 3;
  countdownOverlay.style.visibility = "visible";
  countdownOverlay.style.opacity = 1;
  countdownOverlay.textContent = count;
  countdownOverlay.classList.add("fadeScale");
  safePlay(countdownSounds[count]);

  const interval = setInterval(() => {
    countdownOverlay.classList.remove("fadeScale");
    void countdownOverlay.offsetWidth;

    count--;
    if(count > 0){
      countdownOverlay.textContent = count;
      countdownOverlay.classList.add("fadeScale");
      safePlay(countdownSounds[count]);
    } else if(count === 0){
      countdownOverlay.textContent = "Go!";
      countdownOverlay.classList.add("fadeScale");
      safePlay(countdownSounds["Go"]);
    } else {
      clearInterval(interval);
      countdownOverlay.style.opacity = 0;
      countdownOverlay.style.visibility = "hidden";
      callback();
    }
  },1000);
}

/* Game start */
function startGame() {
  startScreen.style.display = "none";
  resetBtn.style.visibility = "visible";
  clearBestBtn.style.visibility = "visible";
  changeBackBtn.style.visibility = "visible";
  stats.style.visibility = "visible";

  score = 1000; moves = 0; matchedPairs = 0;
  scoreDisplay.textContent = score;
  movesDisplay.textContent = moves;

  createBoard();
  showCountdown(() => {
    gameBoard.style.visibility = "visible";
    startTimer();
  });
}

/* Change card back */
changeBackBtn.addEventListener("click", () => {
  currentBackIndex = (currentBackIndex + 1) % cardBackImages.length;
  document.querySelectorAll(".card .front").forEach(front => {
    front.style.backgroundImage = `url('${cardBackImages[currentBackIndex]}')`;
    front.style.backgroundSize = "cover";
    front.style.backgroundPosition = "center";
  });
});

/* Reset and clear best */
document.getElementById("startBtn").addEventListener("click", startGame);
resetBtn.addEventListener("click", () => { clearInterval(timerInterval); startGame(); });
clearBestBtn.addEventListener("click", () => {
  localStorage.removeItem("bestTime");
  bestTime = null;
  bestTimeDisplay.textContent = "--";
  alert("Best time cleared!");
});

/* Fireworks system */
let fireworks = [];
function launchFireworks() {
  canvas.style.display = "block";
  fireworks = [];
  const centerX = canvas.width/2;
  const centerY = canvas.height/2;
  const duration = 5000;
  const start = Date.now();
  (function animate(){
    const elapsed = Date.now() - start;
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(Math.random()<0.3) fireworks.push(new Firework(centerX,centerY));
    fireworks.forEach((fw,i) => { fw.update(); fw.draw(ctx); if(fw.done) fireworks.splice(i,1); });
    if(elapsed<duration) requestAnimationFrame(animate);
  })();
}
class Firework {
  constructor(x,y){
    this.x=x; this.y=y; this.particles=[];
    this.color=`hsl(${Math.random()*360},100%,60%)`;
    this.exploded=false; this.done=false;
  }
  update(){
    if(!this.exploded){ this.exploded=true; for(let i=0;i<50;i++) this.particles.push(new Particle(this.x,this.y,this.color)); }
    else if(this.exploded && this.particles.length===0){ this.done=true; }
    this.particles.forEach((p,i)=>{ p.update(); if(p.alpha<=0) this.particles.splice(i,1); });
  }
  draw(ctx){ this.particles.forEach(p=>p.draw(ctx)); }
}
class Particle {
  constructor(x,y,color){ this.x=x; this.y=y; this.color=color; this.velX=(Math.random()-0.5)*8; this.velY=(Math.random()-0.5)*8; this.alpha=1; }
  update(){ this.x+=this.velX; this.y+=this.velY; this.alpha-=0.03; }
  draw(ctx){ ctx.globalAlpha=this.alpha; ctx.fillStyle=this.color; ctx.beginPath(); ctx.arc(this.x,this.y,2,0,Math.PI*2); ctx.fill(); ctx.globalAlpha=1; }
}

/* End modal logic */
let _modal=null;
function createEndModal(){
  if(_modal) return;
  const modal=document.createElement('div');
  modal.id='endModal';
  modal.style.position='fixed'; modal.style.left='0'; modal.style.top='0';
  modal.style.width='100%'; modal.style.height='100%';
  modal.style.display='none'; modal.style.alignItems='center'; modal.style.justifyContent='center';
  modal.style.background='rgba(0,0,0,0.5)'; modal.style.zIndex='9999';
  modal.innerHTML=`
    <div id="endModalCard" style="background:#fff;border-radius:10px;padding:20px;width:320px;max-width:90%;box-shadow:0 10px 30px rgba(0,0,0,0.3);text-align:center;">
      <h2 style="margin:0 0 10px;font-size:20px;">🎉 You Win!</h2>
      <div id="endStats" style="margin-bottom:15px; color:#333; font-size:15px;">
        <div>Score: <span id="modalScore">0</span></div>
        <div>Time: <span id="modalTime">0</span>s</div>
        <div>Moves: <span id="modalMoves">0</span></div>
        <div>Best: <span id="modalBest">--</span>s</div>
      </div>
      <div style="display:flex;gap:10px;justify-content:center;">
        <button id="playAgainBtn" style="padding:8px 12px;border:none;border-radius:6px;background:#2b8aef;color:white;cursor:pointer;">Play Again</button>
        <button id="closeModalBtn" style="padding:8px 12px;border:1px solid #ccc;border-radius:6px;background:#fff;cursor:pointer; color:black;">Close</button>
      </div>
    </div>
  `;
  modal.addEventListener('click',e=>{ if(e.target===modal) hideEndModal(); });
  document.addEventListener('keydown',e=>{ if(e.key==='Escape') hideEndModal(); });
  document.body.appendChild(modal);
  _modal=modal;
  document.getElementById('playAgainBtn').addEventListener('click',()=>{ hideEndModal(); clearInterval(timerInterval); startGame(); });
  document.getElementById('closeModalBtn').addEventListener('click',()=>{ hideEndModal(); startScreen.style.display='flex'; });
}

function showEndModal({score,time,moves,bestTime}){
  createEndModal();
  if(!_modal) return;
  _modal.querySelector('#modalScore').textContent=score;
  _modal.querySelector('#modalTime').textContent=time;
  _modal.querySelector('#modalMoves').textContent=moves;
  _modal.querySelector('#modalBest').textContent=bestTime??'--';
  _modal.style.display='flex';
}

function hideEndModal(){ if(_modal) _modal.style.display='none'; canvas.style.display='none'; }
