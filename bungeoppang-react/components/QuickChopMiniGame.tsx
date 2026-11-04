import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../constants';
import { FillingType } from '../types';

interface QuickChopMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const GAME_WIDTH = 500;
const GAME_HEIGHT = 600;
const ITEM_SIZE = 50;
const INITIAL_LIVES = 3;
const GAME_TIME = 30; // seconds
const BONUS_PER_SCORE = 50;
const ITEM_SPAWN_RATE = 500; // ms

type ItemType = FillingType | 'OBSTACLE';
type FallingItem = {
  id: number;
  x: number;
  y: number;
  type: ItemType;
  speed: number;
  rotation: number;
};
type Effect = {
  id: number;
  x: number;
  y: number;
  text: string;
  color: string;
};

const INGREDIENTS = Object.values(FillingType);

const QuickChopMiniGame: React.FC<QuickChopMiniGameProps> = ({ onGameEnd }) => {
  const [items, setItems] = useState<FallingItem[]>([]);
  const [effects, setEffects] = useState<Effect[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'end'>('intro');

  const gameLoopRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // Game Loop
  const runGameLoop = useCallback(() => {
    if (gameStateRef.current !== 'playing') return;

    const now = performance.now();

    // Spawn new items
    if (now - lastSpawnTimeRef.current > ITEM_SPAWN_RATE) {
      lastSpawnTimeRef.current = now;
      const isObstacle = Math.random() < 0.2; // 20% chance for an obstacle
      const type = isObstacle ? 'OBSTACLE' : INGREDIENTS[Math.floor(Math.random() * INGREDIENTS.length)];
      
      setItems(prev => [
        ...prev,
        {
          id: now,
          x: Math.random() * (GAME_WIDTH - ITEM_SIZE),
          y: -ITEM_SIZE,
          type: type,
          speed: 2 + Math.random() * 1.5, // Reduced max speed slightly
          rotation: Math.random() * 360 - 180,
        },
      ]);
    }

    // Update item positions and check for misses
    setItems(prevItems => {
      let livesLost = 0;
      const updatedItems = prevItems.map(item => ({ ...item, y: item.y + item.speed }));
      const remainingItems = updatedItems.filter(item => {
        if (item.y >= GAME_HEIGHT) {
          if (item.type !== 'OBSTACLE') {
            livesLost++;
          }
          return false;
        }
        return true;
      });
      
      if (livesLost > 0) {
        setLives(l => Math.max(0, l - livesLost));
      }
      return remainingItems;
    });

    gameLoopRef.current = requestAnimationFrame(runGameLoop);
  }, []);

  // Timer Countdown
  useEffect(() => {
    if (gameState === 'playing') {
      const timer = window.setInterval(() => {
        setTimeLeft(t => {
          if (t <= 1) {
            clearInterval(timer);
            setGameState('end');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [gameState]);
  
  // Lives check
  useEffect(() => {
    if (lives <= 0 && gameState === 'playing') {
      setGameState('end');
    }
  }, [lives, gameState]);

  // Start/Stop game loop
  useEffect(() => {
    if (gameState === 'playing') {
      lastSpawnTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(runGameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, runGameLoop]);

  const createEffect = (x: number, y: number, text: string, color: string) => {
    const newEffect: Effect = { id: Date.now() + Math.random(), x, y, text, color };
    setEffects(prev => [...prev, newEffect]);
    setTimeout(() => {
      setEffects(prev => prev.filter(e => e.id !== newEffect.id));
    }, 1000);
  };

  const handleItemClick = (item: FallingItem) => {
    if (gameState !== 'playing') return;

    if (item.type === 'OBSTACLE') {
      setLives(l => Math.max(0, l - 1));
      createEffect(item.x, item.y, '실수!', 'text-red-500');
    } else {
      setScore(s => s + 10);
      createEffect(item.x, item.y, '+10', 'text-green-500');
    }
    
    setItems(prev => prev.filter(i => i.id !== item.id));
  };
  
  const bonus = score * BONUS_PER_SCORE;

  if (gameState === 'intro') {
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">재료 빨리 썰기</h2>
        <p className="text-stone-700 text-lg mb-6">떨어지는 재료를 클릭해서 손질하세요. 탄 붕어빵을 누르거나 재료를 놓치면 기회가 줄어듭니다!</p>
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
         <h2 className="text-4xl font-bold text-amber-800 mb-4">게임 종료!</h2>
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
    <div className="bg-amber-200/80 p-4 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <div className="text-lg font-bold text-stone-700">시간: {timeLeft}</div>
        <div className="text-lg font-bold text-green-700">점수: {score}</div>
        <div className="text-lg font-bold text-red-700">기회: {'❤️'.repeat(lives)}</div>
      </div>
      <div
        className="relative bg-sky-200 overflow-hidden w-full border-4 border-slate-700"
        style={{ width: '100%', aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
      >
        {/* Items */}
        {items.map(item => {
          const Icon = item.type === 'OBSTACLE' ? () => <ICONS.BUNGEOPPANG crustLevel={3} /> : ICONS[item.type];
          const HITBOX_SCALE = 1.4; // 40% larger hitbox
          const ITEM_HITBOX_SIZE = ITEM_SIZE * HITBOX_SCALE;

          return (
            <div
              key={item.id}
              className="absolute cursor-pointer flex items-center justify-center"
              style={{
                left: `${(item.x - (ITEM_HITBOX_SIZE - ITEM_SIZE) / 2) / GAME_WIDTH * 100}%`,
                top: `${(item.y - (ITEM_HITBOX_SIZE - ITEM_SIZE) / 2) / GAME_HEIGHT * 100}%`,
                width: `${(ITEM_HITBOX_SIZE / GAME_WIDTH) * 100}%`,
                height: `${(ITEM_HITBOX_SIZE / GAME_HEIGHT) * 100}%`,
              }}
              onClick={() => handleItemClick(item)}
              onTouchStart={(e) => { e.preventDefault(); handleItemClick(item); }}
            >
              <div
                className="w-full h-full"
                style={{
                  transform: `scale(${1 / HITBOX_SCALE}) rotate(${item.rotation}deg)`,
                  pointerEvents: 'none', // Visual element should not block clicks
                }}
              >
                <Icon />
              </div>
            </div>
          );
        })}

        {/* Floating text effects container */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {effects.map(effect => (
              <div
                  key={effect.id}
                  className={`absolute font-bold text-2xl ${effect.color}`}
                  style={{ 
                      left: `${(effect.x / GAME_WIDTH) * 100}%`,
                      top: `${(effect.y / GAME_HEIGHT) * 100}%`,
                      animation: 'tip-fly-up 1s ease-out forwards' 
                  }}
              >
                  {effect.text}
              </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default QuickChopMiniGame;