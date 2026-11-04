import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ICONS } from '../constants';
import { FillingType } from '../types';

interface CatchIngredientsMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const GAME_WIDTH = 500;
const GAME_HEIGHT = 600;
const BASKET_WIDTH = 100;
const BASKET_HEIGHT = 50;
const ITEM_SIZE = 40;
const INITIAL_LIVES = 3;
const BONUS_PER_SCORE = 100;
const ITEM_SPAWN_RATE = 700; // ms
const ITEM_SPEED = 3;

type FallingItem = {
  id: number;
  x: number;
  y: number;
  type: FillingType | 'BURNT';
};

const CATCHABLE_FILLINGS = Object.values(FillingType);

const CatchIngredientsMiniGame: React.FC<CatchIngredientsMiniGameProps> = ({ onGameEnd }) => {
  const [basketX, setBasketX] = useState(GAME_WIDTH / 2 - BASKET_WIDTH / 2);
  const [items, setItems] = useState<FallingItem[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'end'>('intro');

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const itemSpawnTimerRef = useRef<number>();

  // Use refs for state that the game loop needs to access without causing re-renders/stale closures.
  const basketXRef = useRef(basketX);
  basketXRef.current = basketX;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;

  // The main game loop logic, refactored for stability.
  const gameLoop = useCallback(() => {
    setItems(prevItems => {
      let livesToLose = 0;
      let scoreToAdd = 0;

      const updatedItems = prevItems
        .map(item => ({
          ...item,
          y: item.y + ITEM_SPEED,
        }))
        .filter(item => {
          // Check for collision with the basket
          const isCaught =
            item.y + ITEM_SIZE >= GAME_HEIGHT - BASKET_HEIGHT &&
            item.y < GAME_HEIGHT - BASKET_HEIGHT + ITEM_SPEED && 
            item.x + ITEM_SIZE > basketXRef.current &&
            item.x < basketXRef.current + BASKET_WIDTH;

          if (isCaught) {
            if (item.type === 'BURNT') {
              livesToLose++;
            } else {
              scoreToAdd++;
            }
            return false; // Remove item
          }

          // Check if item is off-screen (missed)
          if (item.y >= GAME_HEIGHT) {
            if (item.type !== 'BURNT') {
              livesToLose++; // Lose a life for missing a good ingredient
            }
            return false; // Remove item
          }

          return true; // Keep item
        });

      if (scoreToAdd > 0) {
        setScore(s => s + scoreToAdd);
      }
      if (livesToLose > 0) {
        setLives(l => {
          const newLives = l - livesToLose;
          if (newLives <= 0) {
            setGameState('end');
          }
          return newLives;
        });
      }
      
      return updatedItems;
    });

    // Continue the loop if the game is still active
    if (gameStateRef.current === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
  }, []); // Empty dependency array is crucial for performance and stability.

  const handlePointerMove = (clientX: number) => {
    if (gameState !== 'playing' || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const scale = rect.width / GAME_WIDTH;
    const newX = (clientX - rect.left) / scale - BASKET_WIDTH / 2;
    setBasketX(Math.max(0, Math.min(GAME_WIDTH - BASKET_WIDTH, newX)));
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => handlePointerMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => handlePointerMove(e.touches[0].clientX);

  useEffect(() => {
    if (gameState === 'playing') {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
      itemSpawnTimerRef.current = window.setInterval(() => {
        const isBurnt = Math.random() < 0.25; // 25% chance of being a burnt one
        const type = isBurnt ? 'BURNT' : CATCHABLE_FILLINGS[Math.floor(Math.random() * CATCHABLE_FILLINGS.length)];
        
        setItems(prev => [
          ...prev,
          {
            id: Date.now() + Math.random(),
            x: Math.random() * (GAME_WIDTH - ITEM_SIZE),
            y: -ITEM_SIZE,
            type,
          },
        ]);
      }, ITEM_SPAWN_RATE);
    }

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      if (itemSpawnTimerRef.current) clearInterval(itemSpawnTimerRef.current);
    };
  }, [gameState, gameLoop]);
  
  if (gameState === 'intro') {
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">재료 받기 챌린지</h2>
        <p className="text-stone-700 text-lg mb-6">하늘에서 쏟아지는 재료를 바구니로 받으세요! 탄 붕어빵은 피해야 합니다!</p>
        <button
          onClick={() => setGameState('playing')}
          className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
        >
          게임 시작!
        </button>
      </div>
    );
  }

  const bonus = score * BONUS_PER_SCORE;
  // FIX: Wrapped memoized icon component in a new component to prevent "Expected 1 arguments, but got 0" error.
  const BasketIcon: React.FC = (props) => <ICONS.BASKET {...props} />;
  // FIX: Wrapped memoized icon component in a new component to prevent "Expected 1 arguments, but got 0" error.
  const BurntIcon: React.FC = (props) => <ICONS.BUNGEOPPANG crustLevel={3} {...props} />;

  return (
    <div className="bg-amber-200/80 p-4 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-amber-800">재료를 잡아라!</h2>
        <div className="text-lg font-bold text-green-700">점수: {score}</div>
        <div className="text-lg font-bold text-red-700">목숨: {'❤️'.repeat(lives)}</div>
      </div>
      <div
        ref={gameAreaRef}
        className="relative bg-sky-300 overflow-hidden w-full border-4 border-slate-700 cursor-none"
        style={{ width: '100%', aspectRatio: `${GAME_WIDTH} / ${GAME_HEIGHT}` }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <svg viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`} className="absolute inset-0 w-full h-full">
            {/* Basket */}
            <foreignObject x={basketX} y={GAME_HEIGHT - BASKET_HEIGHT} width={BASKET_WIDTH} height={BASKET_HEIGHT}>
                <BasketIcon />
            </foreignObject>

            {/* Items */}
            {items.map(item => {
                let Icon;
                if (item.type === 'BURNT') {
                    Icon = BurntIcon;
                } else {
                    Icon = ICONS[item.type as FillingType];
                }
                
                return (
                    <foreignObject key={item.id} x={item.x} y={item.y} width={ITEM_SIZE} height={ITEM_SIZE}>
                       <Icon />
                    </foreignObject>
                )
            })}
        </svg>

        {gameState === 'end' && (
           <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg animate-customer-pop-in p-4 text-center">
             <h2 className="text-5xl font-bold mb-4 text-red-400">게임 종료!</h2>
             <p className="text-white text-2xl mb-2">최종 점수: {score}</p>
             <p className="text-white text-xl mb-6">
                 {bonus > 0 ? `보너스 ₩${bonus.toLocaleString()} 획득!` : '아쉽지만 보너스는 없습니다.'}
             </p>
             <button
                 onClick={() => onGameEnd(bonus)}
                 className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
             >
                 가게로 돌아가기
             </button>
           </div>
        )}
      </div>
    </div>
  );
};

export default CatchIngredientsMiniGame;
