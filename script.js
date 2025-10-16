const emojis=["🍎","🍎","🍌","🍌","🍇","🍇","🍊","🍊","🍓","🍓","🍉","🍉","🥝","🥝","🍍","🍍","🍒","🍒","🍈","🍈","🥥","🥥","🍐","🍐","🍋","🍋","🍑","🍑","🥭","🥭","🍏","🍏"];

const cardBackImages=[
  "https://i.imgur.com/8wQdRzk.png",
  "https://i.imgur.com/yR0K7RR.png",
  "https://i.imgur.com/0vQYyqR.png",
  "https://i.imgur.com/CqPFXoX.png",
  "https://i.imgur.com/wUwXnqK.png"
];
let currentBackIndex=0;

let firstCard=null, secondCard=null, lockBoard=false;
let score=1000, moves=0, matchedPairs=0, time=0, timerInterval=null;
let bestTime=localStorage.getItem("bestTime") ? Number(localStorage.getItem("bestTime")) : null;

const gameBoard=document.getElementById("gameBoard");
const scoreDisplay=document.getElementById("score");
const movesDisplay=document.getElementById("moves");
const timerDisplay=document.getElementById("timer");
const bestTimeDisplay=document.getElementById("bestTime");
const flipSound=document.getElementById("flipSound");
const matchSound=document.getElementById("matchSound");
const winSound=document.getElementById("winSound");
const startScreen=document.getElementById("startScreen");
const countdownOverlay=document.getElementById("countdownOverlay");
const stats=document.getElementById("stats");
const resetBtn=document.getElementById("reset");
const clearBestBtn=document.getElementById("clearBest");
const changeBackBtn=document.getElementById("changeBack");
const canvas=document.getElementById("fireworksCanvas");
const ctx=canvas.getContext("2d");
canvas.width=window.innerWidth;
canvas.height=window.innerHeight;

const countdownSounds={3:document.getElementById("count3"),2:document.getElementById("count2"),1:document.getElementById("count1"),Go:document.getElementById("countGo")};

if(bestTime) bestTimeDisplay.textContent=bestTime;

function shuffle(array){ return array.sort(()=>Math.random()-0.5); }

function startTimer(){ clearInterval(timerInterval); time=0; timerDisplay.textContent=time; timerInterval=setInterval(()=>{time++; timerDisplay.textContent=time;},1000); }

function createBoard(){
  const shuffled=shuffle([...emojis]);
  gameBoard.innerHTML="";
  shuffled.forEach(emoji=>{
    const card=document.createElement("div");
    card.classList.add("card");
    card.dataset.emoji=emoji;
    card.innerHTML=`<div class="card-inner"><div class="front" style="background-image:url('${cardBackImages[currentBackIndex]}')"></div><div class="back">${emoji}</div></div>`;
    card.addEventListener("click",flipCard);
    gameBoard.appendChild(card);
  });
}

function flipCard(){
  if(lockBoard || this===firstCard) return;
  this.classList.add("flipped");
  flipSound.currentTime=0; flipSound.play();
  if(!firstCard){ firstCard=this; return; }
  secondCard=this;
  moves++; movesDisplay.textContent=moves;
  checkMatch();
}

function checkMatch(){
  const isMatch=firstCard.dataset.emoji===secondCard.dataset.emoji;

  if(isMatch){
    playPartialMatchSound();
    animateMatch(firstCard);
    animateMatch(secondCard);
    addSparkles(firstCard);
    addSparkles(secondCard);
    disableCards();
    matchedPairs++;

    if(matchedPairs===emojis.length/2){
      clearInterval(timerInterval);
      winSound.play();
      checkBestTime();
      launchFireworks(); // center fireworks
      setTimeout(endGame,5000);
    }
  } else {
    losePoints();
    unflipCards();
  }
}

function playPartialMatchSound(){
  matchSound.currentTime=2;
  matchSound.play();
  setTimeout(()=>{ matchSound.pause(); matchSound.currentTime=0; },2000);
}

function losePoints(){
  score=Math.max(score-15,0);
  scoreDisplay.textContent=score;
}

function animateMatch(card){
  const back=card.querySelector(".back");
  back.classList.add("glow");
  setTimeout(()=>back.classList.remove("glow"),1000);
}

function addSparkles(card){
  const rect=card.getBoundingClientRect();
  for(let i=0;i<6;i++){
    const s=document.createElement("div");
    s.classList.add("sparkle");
    s.style.left=`${rect.left+Math.random()*rect.width}px`;
    s.style.top=`${rect.top+Math.random()*rect.height}px`;
    document.body.appendChild(s);
    setTimeout(()=>s.remove(),1000);
  }
}

function disableCards(){ firstCard.removeEventListener("click",flipCard); secondCard.removeEventListener("click",flipCard); resetBoard(); }
function unflipCards(){ lockBoard=true; setTimeout(()=>{ firstCard.classList.remove("flipped"); secondCard.classList.remove("flipped"); resetBoard(); },800); }
function resetBoard(){ [firstCard,secondCard,lockBoard]=[null,null,false]; }
function checkBestTime(){ if(!bestTime||time<bestTime){ bestTime=time; localStorage.setItem("bestTime",bestTime); bestTimeDisplay.textContent=bestTime; } }

function showCountdown(callback){
  let count=3; countdownOverlay.style.visibility="visible"; countdownOverlay.style.opacity=1; countdownOverlay.textContent=count; countdownOverlay.classList.add("fadeScale"); countdownSounds[count].play();
  const interval=setInterval(()=>{
    countdownOverlay.classList.remove("fadeScale"); void countdownOverlay.offsetWidth;
    count--;
    if(count>0){ countdownOverlay.textContent=count; countdownOverlay.classList.add("fadeScale"); countdownSounds[count].play(); }
    else if(count===0){ countdownOverlay.textContent="Go!"; countdownOverlay.classList.add("fadeScale"); countdownSounds['Go'].play(); }
    else{ clearInterval(interval); countdownOverlay.style.opacity=0; countdownOverlay.style.visibility="hidden"; callback(); }
  },1000);
}

function startGame(){
  startScreen.style.display="none"; resetBtn.style.visibility="visible"; clearBestBtn.style.visibility="visible"; changeBackBtn.style.visibility="visible"; stats.style.visibility="visible";
  score=1000; moves=0; matchedPairs=0; scoreDisplay.textContent=score; movesDisplay.textContent=moves;
  createBoard(); showCountdown(()=>{ gameBoard.style.visibility="visible"; startTimer(); });
}

function endGame(){
  canvas.style.display="none";
  alert(`🎉 You Win!\nScore: ${score}/1000\nTime: ${time}s\nMoves: ${moves}\nBest: ${bestTimeDisplay.textContent}s`);
  startScreen.style.display="flex";
}

changeBackBtn.addEventListener("click",()=>{
  currentBackIndex=(currentBackIndex+1)%cardBackImages.length;
  document.querySelectorAll(".front").forEach(front=>{
    front.style.backgroundImage=`url('${cardBackImages[currentBackIndex]}')`;
  });
});

document.getElementById("startBtn").addEventListener("click",startGame);
resetBtn.addEventListener("click",()=>{ clearInterval(timerInterval); startGame(); });
clearBestBtn.addEventListener("click",()=>{ localStorage.removeItem("bestTime"); bestTime=null; bestTimeDisplay.textContent="--"; alert("Best time cleared!"); });

// 🎆 Fireworks system (center bursts)
let fireworks=[];
function launchFireworks(){
  canvas.style.display="block";
  fireworks=[];
  const centerX=canvas.width/2;
  const centerY=canvas.height/2;
  const duration=5000;
  const start=Date.now();
  (function animate(){
    const elapsed=Date.now()-start;
    ctx.fillStyle="rgba(0,0,0,0.1)";
    ctx.fillRect(0,0,canvas.width,canvas.height);
    if(Math.random()<0.3) fireworks.push(new Firework(centerX, centerY));
    fireworks.forEach((fw,i)=>{
      fw.update(); fw.draw(ctx);
      if(fw.done) fireworks.splice(i,1);
    });
    if(elapsed<duration) requestAnimationFrame(animate);
  })();
}

class Firework{
  constructor(x,y){
    this.x=x; this.y=y;
    this.particles=[];
    this.color=`hsl(${Math.random()*360},100%,60%)`;
    this.exploded=false;
    this.done=false;
  }
  update(){
    if(!this.exploded){
      this.exploded=true;
      for(let i=0;i<50;i++) this.particles.push(new Particle(this.x,this.y,this.color));
    }else if(this.exploded && this.particles.length===0){
      this.done=true;
    }
    this.particles.forEach((p,i)=>{
      p.update();
      if(p.alpha<=0) this.particles.splice(i,1);
    });
  }
  draw(ctx){
    this.particles.forEach(p=>p.draw(ctx));
  }
}

class Particle{
  constructor(x,y,color){
    this.x=x; this.y=y; this.color=color;
    this.velX=(Math.random()-0.5)*8;
    this.velY=(Math.random()-0.5)*8;
    this.alpha=1;
  }
  update(){
    this.x+=this.velX;
    this.y+=this.velY;
    this.alpha-=0.03;
  }
  draw(ctx){
    ctx.globalAlpha=this.alpha;
    ctx.fillStyle=this.color;
    ctx.beginPath();
    ctx.arc(this.x,this.y,2,0,Math.PI*2);
    ctx.fill();
    ctx.globalAlpha=1;
  }
}