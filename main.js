let cvs=document.getElementById('canvas');
let ctx = cvs.getContext('2d');
let stop=true;
let menu = document.querySelectorAll("div.menu")[0];
let menuText=menu.innerHTML;
let curMusic=0;
let divScrore=document.querySelectorAll("div.score")[0];
let masScore=document.querySelectorAll("div.score ul li");
// Загрузка изображений
let bird=new Image(), bg =new Image(), fg =new Image(), pipeNorth =new Image(), pipeSouth = new Image();
bird.src = 'images/56/1.png';
bg.src = 'images/billy/(1).png';
fg.src = 'images/fg.png';
pipeNorth.src = 'images/pipeNorthLocker1.png';
pipeSouth.src = 'images/pipeSouthLocker1.png';
bird.onload = () =>{};
fg.onload = () => {};
pipeNorth.onload = () =>{};
pipeSouth.onload = () =>{};
const gap = 120; 
const north = pipeNorth.height + gap;
let gravity = 1.65;
let bX=10,bY=150;
let score=0;
let frameBird=1,frameBilly=1;
// звуки 
let fly = new Audio(), scor = new Audio(),end = new Audio();
let music = [new Audio(),new Audio(),new Audio()];
fly.src="sounds/spank1.mp3";
scor.src="sounds/WOO.mp3";
end.src = "sounds/AAAAA_1.mp3";
music[0].src='sounds/Titanic.mp3';
music[1].src='sounds/Caramellvansen.mp3';
music[2].src='sounds/Polka.mp3';
//функция  подгонки конваса под размер экрана
function resizeCanvas(){
    /*
    let k=cvs.height/cvs.width;
    let convasWidth=window.innerHeight*k;
    let convasHeight=window.innerWidth*window.innerHeight/convasWidth;
    console.log(window.innerHeight);
    //cvs.width=convasWidth;
    cvs.height=convasHeight;
    cvs.width=window.innerWidth;
   cvs.height=window.innerHeight;
    */
   let emptyWidth=window.innerWidth - cvs.width;
   let emptyHeight= window.innerHeight-cvs.height;
    console.log(emptyHeight/window.innerHeight);
   cvs.style="transform:scaleX(1."+emptyWidth/window.innerWidth+");"+"transform:scaleY(1."+emptyHeight/window.innerHeight+");";
}
// фунция анимации фона
function animeBackground(){
    frameBilly++;
    if (frameBilly>10){frameBilly=1;};
    bg.src = `images/billy/(${frameBilly}).png`;
}
// функция анимации Билли
function animeBilly(){
    frameBird++;
    if (frameBird>10){frameBird=1;};
    bird.src = `images/56/${frameBird}.png`;
}
// Нажатие клавиши
function flyBird(){
    bY -=35;
    fly.play();
}
document.addEventListener('keydown',flyBird);
// координаты столбов
let pipe = [];
pipe[0] = {
    x : cvs.width,
    y : 0
}; 
//позиция мыши
let mouseX;
let mouseY;
function checkPos(mouseEvent){
    if(mouseEvent.pageX || mouseEvent.pageY == 0){
        mouseX = mouseEvent.pageX - this.offsetLeft;
        mouseY = mouseEvent.pageY - this.offsetTop;
    }else if(mouseEvent.offsetX || mouseEvent.offsetY == 0){
        mouseX = mouseEvent.offsetX;
        mouseY = mouseEvent.offsetY;
    }
}
function startGame(){
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        music[0].pause();
        curMusic=getRandomInt(0,3);
        music[curMusic].play();
        document.addEventListener('mouseup',flyBird);
        stop=false;
       menu.style="display:none;"
       divScrore.style="display:none;";
}
//return to main menu 
function ret(){
    menu.innerHTML=menuText;
}
//setings 
function setings(){
    menu.innerHTML=`<div onclick="ret()" class="ret"> <img src="./images/left-arrow.svg" alt="return"> back</div> <br>
    <div class="divVolume"> <span style="vertical-align: super;">Music volume</span>  <input class="vol" onmouseup="changeVol(this)" type="range" min="0" max="100" value="40"><div class="VolumeText"></div></div><br>
    <div class="divVolume"> <span style="vertical-align: super;">Effects volume</span>  <input class="vol" onmouseup="changeVol(this)" type="range" min="0" max="100" value="60"><div class="VolumeText"></div></div> <br>
    `

    let volumeRanges=document.querySelectorAll('input[type="range"]');
    if (localStorage.getItem("musicVol")!=null){
        volumeRanges[0].value=localStorage.getItem("musicVol")*100;
    }
    volumeRanges[0].parentNode.lastChild.innerHTML=` ${volumeRanges[0].value}%`
    volumeRanges[0].onchange= () =>{
    localStorage.setItem("musicVol",volumeRanges[0].value/100);
    let vol = volumeRanges[0].value/100;
    music.forEach((el)=>{
        el.volume=vol;
    })
};
    if (localStorage.getItem("effVol")!=null){
        volumeRanges[1].value=localStorage.getItem("effVol")*100;
    }
    volumeRanges[1].parentNode.lastChild.innerHTML=` ${volumeRanges[1].value}%`
    volumeRanges[1].onchange= () =>{
    localStorage.setItem("effVol",volumeRanges[1].value/100);
    let vol = volumeRanges[1].value/100;
    fly.volume = vol;
    scor.volume = vol;
    end.volume = vol;
    };

}
//change volume
function changeVol(el){
    el.parentNode.lastChild.innerHTML=` ${el.value}%`
}
//about
function about(){
    menu.innerHTML=`<div onclick="ret()" class="ret"> <img src="./images/left-arrow.svg" alt="return"> back</div> <br>
    <div class="divAbout"><img src="./images/Wrestle_in_Peace.jpg" alt="R.I.P"></div>
    `
}

cvs.addEventListener("mousemove", checkPos);

// генератор случайного числа
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min)) + min;
  }
// Рисовка кадров
function draw(){
if (stop==false){   
   ctx.drawImage(bg,0,0,288,450); 
   if (music[curMusic].pause==true){
        curMusic=getRandomInt(0,3);
        music[curMusic].play();
   }
   pipe.forEach(el => {
        ctx.drawImage(pipeNorth,el.x+20,el.y)
        ctx.drawImage(pipeSouth,el.x+20,el.y+242+135)//переменная north не работает ХАХАХАХАХА 242 = это pipeNorth.height  120=это gap
        el.x--;
        if (el.x==125) {
            pipe.push({
                x: cvs.width,
                y: Math.floor(Math.random()*pipeNorth.height)-pipeNorth.height
            });
        }
        // проигрыш
        if (bX + bird.width -20 >= el.x && bX <= el.x + pipeNorth.width && (bY <= el.y + pipeNorth.height || bY+bird.height >= el.y+242+135) || bY + bird.height >=  cvs.height - fg.height) {
            end.play();
            stop=true;
            document.removeEventListener('mouseup',flyBird);
            if (localStorage.getItem("highScore")==null){
            localStorage.setItem("highScore",score);}
            else if(localStorage.getItem("highScore")<score){
                localStorage.setItem("highScore",score);
            }
            masScore[0].lastChild.innerHTML=localStorage.getItem("highScore");
            masScore[1].lastChild.innerHTML=score;

            //canvasRezero();

           // draw();
           // return;
           //location.reload();
        }
        // подсчет очков
        if (el.x == 5) {
            score++;
            scor.play();
        
        }
   });
   ctx.drawImage(fg,0,cvs.height-fg.height)


    ctx.drawImage(bird,bX,bY)
    bY += gravity;
    ctx.fillStyle = "#000";
    ctx.font = "24px Roboto"
    ctx.fillText(`SCORE: ${score}`,10,cvs.height-20);

    //window.cancelAnimationFrame(requestAnimationFrame(draw));
    //console.log(requestID);
}else{
    ctx.drawImage(bg,0,0,288,450); 
    ctx.drawImage(fg,0,cvs.height-fg.height);
    //обнуление переменных
    pipe=[];
    pipe[0] = {
        x : cvs.width,
        y : 0
    }; 
    bX=10,bY=150;
    score=0;
    if (curMusic!=0){
        music[curMusic].pause();
    }
    music[0].play();
    menu.style="display:absolute;"
    divScrore.style="display:absolute;";
}
    requestAnimationFrame(draw);
  // setTimeout(draw,1000/60);
}
//play
//resizeCanvas();
if (localStorage.getItem("musicVol")==null && localStorage.getItem("effVol")==null){
    localStorage.setItem("musicVol",0.4);
    localStorage.setItem("effVol",0.6);
    fly.volume = 0.6;
    scor.volume = 0.6;
    end.volume = 0.6;
    music.forEach((el)=>{
        el.volume=0.4;
    })
}else{
    let vol = localStorage.getItem("musicVol");
    music.forEach((el)=>{
        el.volume=vol;
    });
    vol = localStorage.getItem("effVol");
    fly.volume = vol;
    scor.volume = vol;
    end.volume = vol;
}
if(localStorage.getItem("highScore")==null){
    masScore[0].lastChild.innerHTML=0;
    masScore[1].lastChild.innerHTML=0;
}else{
    masScore[0].lastChild.innerHTML=localStorage.getItem("highScore");
    masScore[1].lastChild.innerHTML=score;
}
draw();
setInterval(animeBackground,250);
setInterval(animeBilly,20);