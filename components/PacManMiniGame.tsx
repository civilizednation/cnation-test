import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ICONS } from '../constants';

// --- Component Props ---
interface PacManMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

// --- Game Constants & Types ---
const TILE_SIZE_DEFAULT = 24;
const INITIAL_LIVES = 3;
const BONUS_PER_PELLET = 10;
const BONUS_PER_GHOST = 200;
const FRIGHTENED_DURATION = 7000; // 7 seconds
const GHOST_NAMES = ['Blinky', 'Pinky', 'Inky', 'Clyde'];
const GAME_TICK_MS = 150; // Controls game speed

const mazeLayout = [
    "WWWWWWWWWWWWWWWWWWWWW",
    "W.o........W........o.W",
    "W.W.WWWWW.W.WWWWW.W.W",
    "W.....................W",
    "W.W.W.WWWWWWW.W.W.W",
    "W...W....W....W...W",
    "WWWWW.WW W WW.WWWWW",
    "      WGGGW      ",
    "WWWWW.WW W WW.WWWWW",
    "W...W....W....W...W",
    "W.W.W.WWWWWWW.W.W.W",
    "W.....................W",
    "W.W.WWWWW.W.WWWWW.W.W",
    "W.o...P....W....o...W",
    "WWWWWWWWWWWWWWWWWWWWW",
];


const MAZE_WIDTH = mazeLayout[0].length;
const MAZE_HEIGHT = mazeLayout.length;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT' | 'STOP';
type Position = { x: number; y: number };
type GhostState = 'CHASE' | 'SCATTER' | 'FRIGHTENED';
type Ghost = {
  id: number;
  name: string;
  pos: Position;
  dir: Direction;
  state: GhostState;
  colorFilter: string;
};

// --- Helper Functions ---
const isWall = (x: number, y: number, layout: string[]): boolean => {
  if (x < 0 || x >= MAZE_WIDTH || y < 0 || y >= MAZE_HEIGHT) return true;
  return layout[y][x] === 'W';
};

// --- Main Component ---
const PacManMiniGame: React.FC<PacManMiniGameProps> = ({ onGameEnd }) => {
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'end'>('intro');
  const [pellets, setPellets] = useState<boolean[][]>([]);
  const [totalPellets, setTotalPellets] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [ghosts, setGhosts] = useState<Ghost[]>([]);
  const [tileSize, setTileSize] = useState(TILE_SIZE_DEFAULT);
  
  const playerDir = useRef<Direction>('STOP');
  const playerNextDir = useRef<Direction>('STOP');
  const frightenedTimer = useRef<number>(0);
  const gameLoopRef = useRef<number>();
  const lastUpdateTime = useRef<number>(0);
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // --- Responsive Sizing ---
  useEffect(() => {
    const container = gameContainerRef.current;
    if (!container) return;
    const resizeObserver = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        const tileW = width / MAZE_WIDTH;
        const tileH = height / MAZE_HEIGHT;
        setTileSize(Math.min(tileW, tileH));
      }
    });
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  // --- Game Initialization ---
  const initGame = useCallback(() => {
    let pelletCount = 0;
    const newPellets: boolean[][] = Array(MAZE_HEIGHT).fill(null).map(() => Array(MAZE_WIDTH).fill(false));
    let initialPlayerPos: Position = { x: 0, y: 0 };
    const initialGhosts: Ghost[] = [];
    let ghostIndex = 0;
    
    mazeLayout.forEach((row, y) => {
      row.split('').forEach((char, x) => {
        if (char === 'P') initialPlayerPos = { x, y };
        if (char === '.' || char === 'o') {
          newPellets[y][x] = true;
          pelletCount++;
        }
        if (char === 'G') {
            if (initialGhosts.length < GHOST_NAMES.length) {
                const ghostColors = ['hue-rotate(0deg)', 'hue-rotate(270deg)', 'hue-rotate(180deg)', 'hue-rotate(45deg)'];
                initialGhosts.push({
                    id: ghostIndex,
                    name: GHOST_NAMES[ghostIndex],
                    pos: { x, y },
                    dir: 'UP',
                    state: 'CHASE',
                    colorFilter: ghostColors[ghostIndex]
                });
                ghostIndex++;
            }
        }
      });
    });

    setPlayerPos(initialPlayerPos);
    setGhosts(initialGhosts);
    setPellets(newPellets);
    setTotalPellets(pelletCount);
    setScore(0);
    setLives(INITIAL_LIVES);
    playerDir.current = 'STOP';
    playerNextDir.current = 'STOP';
  }, []);

  useEffect(() => {
    initGame();
  }, [initGame]);

  // --- Main Game Loop ---
  const gameLoop = useCallback((timestamp: number) => {
    if (gameState !== 'playing') return;

    const delta = timestamp - lastUpdateTime.current;
    if (delta < GAME_TICK_MS) {
        gameLoopRef.current = requestAnimationFrame(gameLoop);
        return;
    }
    lastUpdateTime.current = timestamp;

    // --- Player Movement Calculation ---
    const { x, y } = playerPos;
    let nextPlayerPos = { ...playerPos };
    
    if (playerNextDir.current !== 'STOP') {
        if (playerNextDir.current === 'UP' && !isWall(x, y-1, mazeLayout)) playerDir.current = playerNextDir.current;
        if (playerNextDir.current === 'DOWN' && !isWall(x, y+1, mazeLayout)) playerDir.current = playerNextDir.current;
        if (playerNextDir.current === 'LEFT' && !isWall(x-1, y, mazeLayout)) playerDir.current = playerNextDir.current;
        if (playerNextDir.current === 'RIGHT' && !isWall(x+1, y, mazeLayout)) playerDir.current = playerNextDir.current;
    }

    if (playerDir.current === 'UP') nextPlayerPos.y -= 1;
    if (playerDir.current === 'DOWN') nextPlayerPos.y += 1;
    if (playerDir.current === 'LEFT') nextPlayerPos.x -= 1;
    if (playerDir.current === 'RIGHT') nextPlayerPos.x += 1;
    
    if (isWall(nextPlayerPos.x, nextPlayerPos.y, mazeLayout)) {
        playerDir.current = 'STOP';
        nextPlayerPos = playerPos; // Revert movement
    }
    
    // --- Pellet Collision ---
    const pX = Math.round(nextPlayerPos.x);
    const pY = Math.round(nextPlayerPos.y);
    if (pellets[pY][pX]) {
        setPellets(prev => {
            const newPellets = prev.map(r => [...r]);
            newPellets[pY][pX] = false;
            return newPellets;
        });
        setScore(s => s + BONUS_PER_PELLET);
        setTotalPellets(c => c - 1);
        if (mazeLayout[pY][pX] === 'o') {
            frightenedTimer.current = FRIGHTENED_DURATION;
        }
    }
    
    // --- Ghost Update ---
    if (frightenedTimer.current > 0) {
        frightenedTimer.current -= GAME_TICK_MS;
    }
    
    let playerWasHit = false;
    const newGhosts = ghosts.map(ghost => {
        const isFrightened = frightenedTimer.current > 0;
        const newGhost = { ...ghost, pos: { ...ghost.pos }, state: isFrightened ? 'FRIGHTENED' : 'CHASE' };
        
        const choices: Direction[] = [];
        if (!isWall(newGhost.pos.x, newGhost.pos.y-1, mazeLayout)) choices.push('UP');
        if (!isWall(newGhost.pos.x, newGhost.pos.y+1, mazeLayout)) choices.push('DOWN');
        if (!isWall(newGhost.pos.x-1, newGhost.pos.y, mazeLayout)) choices.push('LEFT');
        if (!isWall(newGhost.pos.x+1, newGhost.pos.y, mazeLayout)) choices.push('RIGHT');
        
        const oppositeDir: Record<Direction, Direction> = { 'UP': 'DOWN', 'DOWN': 'UP', 'LEFT': 'RIGHT', 'RIGHT': 'LEFT', 'STOP': 'STOP' };
        let availableChoices = choices.filter(c => c !== oppositeDir[newGhost.dir]);
        if (availableChoices.length === 0) availableChoices = choices;
        newGhost.dir = availableChoices[Math.floor(Math.random() * availableChoices.length)];

        if (newGhost.dir === 'UP') newGhost.pos.y -= 1;
        if (newGhost.dir === 'DOWN') newGhost.pos.y += 1;
        if (newGhost.dir === 'LEFT') newGhost.pos.x -= 1;
        if (newGhost.dir === 'RIGHT') newGhost.pos.x += 1;

        if (newGhost.pos.x === pX && newGhost.pos.y === pY) {
            if (newGhost.state === 'FRIGHTENED') {
                setScore(s => s + BONUS_PER_GHOST);
                newGhost.pos = {x: 10, y: 7};
            } else {
                playerWasHit = true;
            }
        }
        return newGhost;
    });

    if (playerWasHit) {
        setLives(l => l - 1);
        nextPlayerPos = {x: 10, y: 13};
        playerDir.current = 'STOP';
        playerNextDir.current = 'STOP';
    }

    setPlayerPos(nextPlayerPos);
    setGhosts(newGhosts);

    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, playerPos, pellets, ghosts]);

  // Game state transitions
  useEffect(() => {
    if ((totalPellets <= 0 && gameState === 'playing') || (lives <= 0 && gameState === 'playing')) {
      setGameState('end');
    }
  }, [totalPellets, lives, gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      e.preventDefault();
      if (e.key === 'ArrowUp') playerNextDir.current = 'UP';
      if (e.key === 'ArrowDown') playerNextDir.current = 'DOWN';
      if (e.key === 'ArrowLeft') playerNextDir.current = 'LEFT';
      if (e.key === 'ArrowRight') playerNextDir.current = 'RIGHT';
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Start/Stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      lastUpdateTime.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    }
  }, [gameState, gameLoop]);
  
  const bonus = score;
  
  if (gameState === 'intro') {
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">붕어빵 팩맨</h2>
        <p className="text-stone-700 text-lg mb-6">미로를 탐험하며 팥을 모두 먹어치우세요! 탄 붕어빵 유령들을 조심하세요.</p>
        <button
          onClick={() => setGameState('playing')}
          className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
        >
          게임 시작!
        </button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
       <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg text-center flex flex-col items-center">
         <h2 className="text-4xl font-bold text-amber-800 mb-4">{totalPellets === 0 ? '성공!' : '게임 오버!'}</h2>
         <p className="text-2xl text-stone-700 mb-2">최종 점수: {score}</p>
         <p className="text-xl text-green-600 font-bold mb-6">획득 보너스: ₩{bonus.toLocaleString()}</p>
         <button
           onClick={() => onGameEnd(bonus)}
           className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
         >
           가게로 돌아가기
         </button>
       </div>
    );
  }

  return (
    <div className="bg-slate-900 p-2 sm:p-4 rounded-xl shadow-inner border-2 border-slate-700 w-full max-w-2xl flex-grow flex flex-col items-center overflow-hidden">
      <div className="w-full flex justify-between items-center mb-2 sm:mb-4 text-white font-bold text-base sm:text-lg px-2">
        <div>점수: {score}</div>
        <div>남은 목숨: {'❤️'.repeat(lives)}</div>
      </div>
      <div
        ref={gameContainerRef}
        className="relative w-full flex-grow flex items-center justify-center"
      >
        <div className="relative bg-black" style={{ width: MAZE_WIDTH * tileSize, height: MAZE_HEIGHT * tileSize }}>
            {/* Walls */}
            {mazeLayout.map((row, y) => row.split('').map((char, x) => {
                if (char !== 'W') return null;
                return <div key={`${x}-${y}`} className="absolute bg-blue-800" style={{left: x*tileSize, top: y*tileSize, width: tileSize, height: tileSize}}/>
            }))}
            {/* Pellets */}
            {pellets.map((row, y) => row.map((hasPellet, x) => {
                if (!hasPellet) return null;
                const isPowerPellet = mazeLayout[y][x] === 'o';
                return <div key={`p-${x}-${y}`} className="absolute flex items-center justify-center" style={{left: x*tileSize, top: y*tileSize, width: tileSize, height: tileSize}}>
                    <div className={`transition-transform duration-500 ${isPowerPellet ? 'w-2/3 h-2/3 animate-pulse' : 'w-1/3 h-1/3'}`}>
                        {isPowerPellet ? <ICONS.CHOUX_CREAM /> : <ICONS.RED_BEAN />}
                    </div>
                </div>
            }))}
            {/* Player */}
            <div className="absolute" style={{ transition: `all ${GAME_TICK_MS}ms linear`, left: playerPos.x * tileSize, top: playerPos.y * tileSize, width: tileSize, height: tileSize }}>
                <ICONS.BUNGEOPPANG />
            </div>
            {/* Ghosts */}
            {ghosts.map(g => (
                <div key={g.id} className="absolute" style={{ 
                    transition: `all ${GAME_TICK_MS}ms linear, filter 0.3s ease-in-out`,
                    left: g.pos.x * tileSize, 
                    top: g.pos.y * tileSize, 
                    width: tileSize, 
                    height: tileSize,
                    filter: g.state === 'FRIGHTENED' ? 'invert(1) hue-rotate(180deg) saturate(2)' : g.colorFilter,
                    opacity: g.state === 'FRIGHTENED' && (frightenedTimer.current < 2000 && Math.floor(frightenedTimer.current / 200) % 2 === 0) ? 0.5 : 1,
                    }}>
                    <ICONS.BUNGEOPPANG crustLevel={3} />
                </div>
            ))}
        </div>
      </div>
       <div className="mt-2 sm:mt-4 grid grid-cols-3 gap-2 w-48 sm:w-56 select-none">
        <div />
        <button onTouchStart={() => playerNextDir.current = 'UP'} className="h-12 sm:h-16 bg-slate-500 text-white font-bold text-2xl sm:text-3xl rounded-full shadow-md active:bg-slate-600">▲</button>
        <div />
        <button onTouchStart={() => playerNextDir.current = 'LEFT'} className="h-12 sm:h-16 bg-slate-500 text-white font-bold text-2xl sm:text-3xl rounded-full shadow-md active:bg-slate-600">◀</button>
        <div />
        <button onTouchStart={() => playerNextDir.current = 'RIGHT'} className="h-12 sm:h-16 bg-slate-500 text-white font-bold text-2xl sm:text-3xl rounded-full shadow-md active:bg-slate-600">▶</button>
        <div />
        <button onTouchStart={() => playerNextDir.current = 'DOWN'} className="h-12 sm:h-16 bg-slate-500 text-white font-bold text-2xl sm:text-3xl rounded-full shadow-md active:bg-slate-600">▼</button>
        <div />
      </div>
    </div>
  );
};

export default PacManMiniGame;
