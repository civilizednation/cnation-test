// cnation-bungeoppang 게임 메인 로직

// 사운드 매니저 (Assets/Sound 폴더 연결)
const sounds = {
  bgm: new Audio('Assets/Sound/bgm3.mp3'),
  bean: new Audio('Assets/Sound/bean.mp3'),
  flip: new Audio('Assets/Sound/metal-p04.mp3'),
  burn: new Audio('Assets/Sound/burn2.mp3'),
  success: new Audio('Assets/Sound/success.mp3'),
  bell: new Audio('Assets/Sound/small-bell01.mp3'),
  good: new Audio('Assets/Sound/good.mp3'),
  sad: new Audio('Assets/Sound/sad.mp3'),
  kettle: new Audio('Assets/Sound/kettle.mp3'),
  box: new Audio('Assets/Sound/box.mp3'),
  start: new Audio('Assets/Sound/start.mp3')
};

sounds.bgm.loop = true;
sounds.bgm.volume = 0.45;

let isBgmOn = true;
function toggleBgm() {
  isBgmOn = !isBgmOn;
  const btn = document.getElementById('bgm-toggle-btn');
  if (isBgmOn) {
    sounds.bgm.play().catch(() => {});
    btn.innerText = '🔊';
  } else {
    sounds.bgm.pause();
    btn.innerText = '🔇';
  }
}

function playSfx(name) {
  if (sounds[name]) {
    const s = sounds[name].cloneNode();
    s.volume = 0.8;
    s.play().catch(() => {});
  }
}

// 붕어빵 이미지 매핑 (Assets/Sprites 경로)
const MOLD_IMAGES = {
  EMPTY: 'Assets/Sprites/mold1%201.png',
  BATTER: 'Assets/Sprites/rawBread3.png',
  REDBEAN: 'Assets/Sprites/redBeanBread3.png',
  COOKING_1: 'Assets/Sprites/freshBread3.png',
  COOKED_1: 'Assets/Sprites/sosoBread3.png',
  GOOD: 'Assets/Sprites/goodBread3.png',
  BURNED: 'Assets/Sprites/fireBread2%201.png'
};

// 도구 이미지 매핑
const TOOL_IMAGES = {
  1: { normal: 'Assets/Sprites/pottle.png', active: 'Assets/Sprites/pottle2.png' },
  2: { normal: 'Assets/Sprites/redBean2.png', active: 'Assets/Sprites/redBean2%201.png' },
  3: { normal: 'Assets/Sprites/stick.png', active: 'Assets/Sprites/stick2.png' }
};

// 상자 수량별 이미지
const BOX_IMAGES = [
  'Assets/Sprites/box.png',
  'Assets/Sprites/fish1box.png',
  'Assets/Sprites/fish2box.png',
  'Assets/Sprites/fish3box.png'
];

// 동물 손님 9종 (기본 / 실망 표정 스프라이트)
const CUSTOMER_DATA = [
  { name: '곰', normal: 'Assets/Sprites/bear2%201.png', sad: 'Assets/Sprites/bear2%202.png', dialogue: '붕어빵... {0}개만 주세요. 너무 맛있어 보여서요...' },
  { name: '코끼리', normal: 'Assets/Sprites/elephant2.png', sad: 'Assets/Sprites/elephant2%201.png', dialogue: '붕어빵 {0}개만 주게. 날씨가 참 춥구먼.' },
  { name: '독수리', normal: 'Assets/Sprites/eagle2.png', sad: 'Assets/Sprites/eagle2%201.png', dialogue: '저기, 붕어빵 {0}개 줘! 날개가 너무 시려워.' },
  { name: '여우', normal: 'Assets/Sprites/fox%201.png', sad: 'Assets/Sprites/fox2.png', dialogue: '붕어빵 맛있어 보이네요! {0}개 주세요~' },
  { name: '사자', normal: 'Assets/Sprites/lion.png', sad: 'Assets/Sprites/lion.png', dialogue: '따뜻한 붕어빵 {0}개 부탁드려도 될까요?' },
  { name: '고릴라', normal: 'Assets/Sprites/gorila.png', sad: 'Assets/Sprites/gorila2.png', dialogue: '붕어빵 하나론 부족해. {0}개 포장해줘!' },
  { name: '호랑이', normal: 'Assets/Sprites/tiger%201.png', sad: 'Assets/Sprites/tiger1%202.png', dialogue: '붕어빵 {0}마리만 주시게. 팥 듬뿍 넣은 걸로.' },
  { name: '늑대', normal: 'Assets/Sprites/wolf2.png', sad: 'Assets/Sprites/wolf2%201.png', dialogue: '저기요, 붕어빵 {0}개만 포장해 주세요.' },
  { name: '백호', normal: 'Assets/Sprites/tiger2_2.png', sad: 'Assets/Sprites/tiger2_2%202.png', dialogue: '따끈따끈한 붕어빵 {0}개 부탁드려요!' }
];

// 상태 변수
let currentTool = 1;
let breadBoxCount = 0;
let totalSold = 0;
let totalCreated = 0;
let money = 0;
let gameTime = 210;
let baseCookingDelay = 4.5;
let isGameOver = false;

// 3x3 슬롯 배열
const slots = Array.from({ length: 9 }, (_, i) => ({
  id: i,
  state: 'EMPTY',
  timer: 0,
  targetTime: 0,
  isSecondSide: false,
  isFlipping: false
}));

let currentCustomer = null;
let customerTimer = 0;
const customerMaxWait = 35;

function selectTool(id) {
  playSfx('kettle');
  currentTool = id;
  for (let t = 1; t <= 3; t++) {
    const el = document.getElementById(t === 1 ? 'tool-kettle' : t === 2 ? 'tool-redbean' : 'tool-stick');
    const img = document.getElementById(t === 1 ? 'tool-img-kettle' : t === 2 ? 'tool-img-redbean' : 'tool-img-stick');
    if (t === id) {
      el.classList.add('active');
      img.src = TOOL_IMAGES[t].active;
    } else {
      el.classList.remove('active');
      img.src = TOOL_IMAGES[t].normal;
    }
  }
}

function renderBoard() {
  const grid = document.getElementById('mold-grid');
  grid.innerHTML = '';
  slots.forEach((slot, index) => {
    const div = document.createElement('div');
    div.className = 'mold-slot';
    div.id = `slot-${index}`;
    div.onclick = () => onSlotClick(index);

    let imgSrc = MOLD_IMAGES[slot.state];
    let prog = 0;
    if (slot.state === 'COOKING_1' || slot.state === 'COOKED_1' || slot.state === 'GOOD') {
      prog = Math.min(100, (slot.timer / slot.targetTime) * 100);
    }

    div.innerHTML = `
      <div class="slot-inner ${slot.isFlipping ? 'flipping' : ''}">
        <img src="${imgSrc}" class="mold-graphic" alt="붕어빵">
      </div>
      ${(slot.state === 'COOKING_1' || slot.state === 'COOKED_1' || slot.state === 'GOOD') ? `
        <div class="slot-gauge-bar">
          <div class="slot-gauge-fill" style="width: ${prog}%"></div>
        </div>
      ` : ''}
    `;
    grid.appendChild(div);
  });
}

function triggerFlipAnimation(slot, callback) {
  slot.isFlipping = true;
  renderBoard();
  playSfx('flip');
  setTimeout(() => {
    if (callback) callback();
    slot.isFlipping = false;
    renderBoard();
  }, 220);
}

function onSlotClick(index) {
  if (isGameOver) return;
  const slot = slots[index];
  if (slot.isFlipping) return;

  if (currentTool === 1) {
    if (slot.state === 'EMPTY') {
      playSfx('bean');
      slot.state = 'BATTER';
      renderBoard();
    }
  } else if (currentTool === 2) {
    if (slot.state === 'BATTER') {
      playSfx('bean');
      slot.state = 'REDBEAN';
      renderBoard();
    }
  } else if (currentTool === 3) {
    if (slot.state === 'REDBEAN') {
      triggerFlipAnimation(slot, () => {
        slot.state = 'COOKING_1';
        slot.timer = 0;
        slot.targetTime = baseCookingDelay;
      });
    } else if (slot.state === 'COOKED_1') {
      triggerFlipAnimation(slot, () => {
        slot.state = 'COOKING_1';
        slot.timer = 0;
        slot.isSecondSide = true;
        slot.targetTime = baseCookingDelay;
      });
    } else if (slot.state === 'GOOD') {
      if (breadBoxCount < 13) {
        playSfx('success');
        breadBoxCount++;
        totalCreated++;
        updateBreadBoxUI();
      }
      slot.state = 'EMPTY';
      slot.timer = 0;
      slot.isSecondSide = false;
      renderBoard();
    } else if (slot.state === 'BURNED') {
      playSfx('bean');
      slot.state = 'EMPTY';
      slot.timer = 0;
      slot.isSecondSide = false;
      renderBoard();
    }
  }
}

function updateBreadBoxUI() {
  document.getElementById('breadbox-badge').innerText = `${breadBoxCount}개`;
  const imgIdx = Math.min(3, breadBoxCount);
  document.getElementById('breadbox-img').src = BOX_IMAGES[imgIdx];
}

setInterval(() => {
  if (isGameOver) return;
  let needRender = false;
  slots.forEach(slot => {
    if (slot.state === 'COOKING_1') {
      slot.timer += 0.1;
      if (slot.timer >= slot.targetTime) {
        if (!slot.isSecondSide) {
          slot.state = 'COOKED_1';
          slot.timer = 0;
          slot.targetTime = baseCookingDelay * 1.5;
        } else {
          slot.state = 'GOOD';
          slot.timer = 0;
          slot.targetTime = baseCookingDelay * 1.8;
        }
      }
      needRender = true;
    } else if (slot.state === 'COOKED_1' || slot.state === 'GOOD') {
      slot.timer += 0.1;
      if (slot.timer >= slot.targetTime) {
        playSfx('burn');
        slot.state = 'BURNED';
      }
      needRender = true;
    }
  });
  if (needRender) renderBoard();
}, 100);

function spawnCustomer() {
  const c = CUSTOMER_DATA[Math.floor(Math.random() * CUSTOMER_DATA.length)];
  const need = Math.floor(Math.random() * 4) + 1;
  currentCustomer = {
    ...c,
    needCount: need,
    patience: customerMaxWait
  };
  customerTimer = customerMaxWait;
  playSfx('bell');

  const avatar = document.getElementById('customer-img');
  avatar.src = c.normal;
  avatar.style.transform = 'scale(1)';

  const text = c.dialogue.replace('{0}', `<span class="order-highlight">${need}개</span>`);
  document.getElementById('dialogue-text').innerHTML = text;
  updatePatienceBar();
}

function updatePatienceBar() {
  const bar = document.getElementById('patience-gauge-fill');
  if (!currentCustomer) {
    bar.style.width = '0%';
    return;
  }
  const pct = (customerTimer / customerMaxWait) * 100;
  bar.style.width = `${pct}%`;
  if (pct > 50) bar.style.background = '#4caf50';
  else if (pct > 25) bar.style.background = '#ff9800';
  else bar.style.background = '#f44336';
}

function handleBreadBoxClick() {
  playSfx('box');
  if (!currentCustomer || isGameOver) return;
  const bubble = document.getElementById('dialogue-text');
  const avatar = document.getElementById('customer-img');

  if (breadBoxCount === currentCustomer.needCount) {
    playSfx('good');
    const earned = currentCustomer.needCount * 1000;
    money += earned;
    totalSold += currentCustomer.needCount;
    breadBoxCount = 0;
    updateBreadBoxUI();
    document.getElementById('money-text').innerText = `${money.toLocaleString()}원`;

    bubble.innerHTML = '<b>와! 따끈따끈해서 최고예요! 또 올게요!</b>';
    avatar.style.transform = 'scale(1.12)';
    currentCustomer = null;
    setTimeout(spawnCustomer, 2200);
  } else {
    playSfx('sad');
    avatar.src = currentCustomer.sad;
    bubble.innerHTML = `<span style="color:#c62828"><b>갯수가 틀렸잖아요! 저는 <span class="order-highlight">${currentCustomer.needCount}개</span> 시켰어요!</b></span>`;
    avatar.style.transform = 'rotate(-8deg)';
  }
}

setInterval(() => {
  if (isGameOver) return;
  if (gameTime > 0) {
    gameTime--;
    const min = String(Math.floor(gameTime / 60)).padStart(2, '0');
    const sec = String(gameTime % 60).padStart(2, '0');
    document.getElementById('timer-text').innerText = `${min}:${sec}`;

    const sky = document.getElementById('sky-bg');
    if (gameTime === 140) {
      sky.style.backgroundImage = "url('Assets/Sprites/10.png')";
      baseCookingDelay = Math.max(1.8, baseCookingDelay - 0.9);
    } else if (gameTime === 70) {
      sky.style.backgroundImage = "url('Assets/Sprites/night.png')";
      baseCookingDelay = Math.max(1.8, baseCookingDelay - 0.9);
    }
  } else {
    endGame();
    return;
  }

  if (currentCustomer) {
    customerTimer--;
    updatePatienceBar();
    if (customerTimer <= 0) {
      playSfx('sad');
      document.getElementById('customer-img').src = currentCustomer.sad;
      document.getElementById('dialogue-text').innerHTML = '<span style="color:#777">너무 오래 기다려서 그냥 갈게요...</span>';
      currentCustomer = null;
      setTimeout(spawnCustomer, 2500);
    }
  }
}, 1000);

function endGame() {
  isGameOver = true;
  sounds.bgm.pause();
  playSfx('start');
  const netIncome = (totalSold * 1000) - (totalCreated * 500);
  document.getElementById('res-sold-count').innerText = `${totalSold}개`;
  document.getElementById('res-sold-money').innerText = `+${(totalSold * 1000).toLocaleString()}원`;
  document.getElementById('res-created-count').innerText = `${totalCreated}개`;
  document.getElementById('res-created-cost').innerText = `-${(totalCreated * 500).toLocaleString()}원`;
  document.getElementById('res-total-profit').innerText = `${netIncome.toLocaleString()}원`;
  document.getElementById('gameover-modal').style.display = 'flex';
}

function startGame() {
  document.getElementById('start-modal').style.display = 'none';
  playSfx('start');
  if (isBgmOn) sounds.bgm.play().catch(() => {});
  initGame();
}

function openHelp() { document.getElementById('help-modal').style.display = 'flex'; }
function closeHelp() { document.getElementById('help-modal').style.display = 'none'; }
function restartGame() {
  document.getElementById('gameover-modal').style.display = 'none';
  if (isBgmOn) sounds.bgm.play().catch(() => {});
  initGame();
}

function initGame() {
  gameTime = 210;
  baseCookingDelay = 4.5;
  breadBoxCount = 0;
  totalSold = 0;
  totalCreated = 0;
  money = 0;
  isGameOver = false;

  slots.forEach(s => {
    s.state = 'EMPTY';
    s.timer = 0;
    s.isSecondSide = false;
    s.isFlipping = false;
  });

  updateBreadBoxUI();
  document.getElementById('money-text').innerText = '0원';
  document.getElementById('sky-bg').style.backgroundImage = "url('Assets/Sprites/morning.png')";
  selectTool(1);
  renderBoard();
  spawnCustomer();
}
