import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';

interface BungeoppangStackingMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

// Game constants
const GAME_WIDTH = 500;
const GAME_HEIGHT = 600;
const PLATE_WIDTH = 120;
const PLATE_HEIGHT = 20;
const BUN_WIDTH = 64;
const BUN_HEIGHT = 42;
const INITIAL_LIVES = 3;
const BONUS_PER_SCORE = 150;
const ITEM_SPAWN_RATE = 1500; // ms
const ITEM_SPEED = 2.5;

type FallingBungeoppang = {
  id: number;
  x: number;
  y: number;
};

const BungeoppangStackingMiniGame: React.FC<BungeoppangStackingMiniGameProps> = ({ onGameEnd }) => {
  const [plateX, setPlateX] = useState(GAME_WIDTH / 2 - PLATE_WIDTH / 2);
  const [items, setItems] = useState<FallingBungeoppang[]>([]);
  const [stackedItems, setStackedItems] = useState<FallingBungeoppang[]>([]);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'end'>('intro');

  const gameAreaRef = useRef<HTMLDivElement>(null);
  const gameLoopRef = useRef<number>();
  const lastSpawnTimeRef = useRef<number>(0);

  // Refs for state that are updated every render and read by the game loop
  const plateXRef = useRef(plateX);
  plateXRef.current = plateX;
  const gameStateRef = useRef(gameState);
  gameStateRef.current = gameState;
  const stackedItemsRef = useRef(stackedItems);
  stackedItemsRef.current = stackedItems;

  const handlePointerMove = (clientX: number) => {
    if (gameStateRef.current !== 'playing' || !gameAreaRef.current) return;
    const rect = gameAreaRef.current.getBoundingClientRect();
    const scale = rect.width / GAME_WIDTH;
    const newX = (clientX - rect.left) / scale - PLATE_WIDTH / 2;
    setPlateX(Math.max(0, Math.min(GAME_WIDTH - PLATE_WIDTH, newX)));
  };
  
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => handlePointerMove(e.clientX);
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => handlePointerMove(e.touches[0].clientX);

  useEffect(() => {
    // This effect runs only once and sets up the main game loop that runs continuously.
    const gameLoop = (timestamp: number) => {
      // The loop only runs game logic if the state is 'playing'
      if (gameStateRef.current === 'playing') {
        // Spawn new items based on time
        if (timestamp - lastSpawnTimeRef.current > ITEM_SPAWN_RATE) {
          lastSpawnTimeRef.current = timestamp;
          setItems(prev => [
            ...prev,
            {
              id: Date.now() + Math.random(),
              x: Math.random() * (GAME_WIDTH - BUN_WIDTH),
              y: -BUN_HEIGHT,
            },
          ]);
        }
        
        // Update existing items using functional updates to get the latest state
        let livesToLose = 0;
        let scoreToAdd = 0;
        const itemsToStack: FallingBungeoppang[] = [];

        setItems(currentItems => {
          const remainingItems: FallingBungeoppang[] = [];
          
          for (const item of currentItems) {
            const newItem = { ...item, y: item.y + ITEM_SPEED };
            
            const currentStackHeight = stackedItemsRef.current.length * (BUN_HEIGHT * 0.4);
            const isCaught =
              newItem.y + BUN_HEIGHT >= GAME_HEIGHT - PLATE_HEIGHT - currentStackHeight &&
              newItem.y < GAME_HEIGHT - PLATE_HEIGHT &&
              newItem.x + BUN_WIDTH > plateXRef.current &&
              newItem.x < plateXRef.current + PLATE_WIDTH;

            if (isCaught) {
              itemsToStack.push(newItem);
            } else if (newItem.y >= GAME_HEIGHT) {
              livesToLose++;
            } else {
              remainingItems.push(newItem);
            }
          }
          
          if (itemsToStack.length > 0) {
            scoreToAdd += itemsToStack.length;
            setStackedItems(prevStacked => {
              let newStacked = [...prevStacked];
              itemsToStack.forEach(item => {
                const centeredX = plateXRef.current + (PLATE_WIDTH / 2) - (BUN_WIDTH / 2);
                newStacked.push({
                    ...item,
                    x: centeredX,
                    y: GAME_HEIGHT - PLATE_HEIGHT - (newStacked.length + 1) * (BUN_HEIGHT * 0.4) 
                });
              });
              return newStacked;
            });
          }
          
          return remainingItems;
        });

        if (scoreToAdd > 0) {
          setScore(s => s + scoreToAdd);
        }

        if (livesToLose > 0) {
          setLives(l => {
            const newLives = l - livesToLose;
            if (newLives <= 0 && gameStateRef.current === 'playing') {
              setGameState('end');
            }
            return Math.max(0, newLives);
          });
        }
      }
      
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };

    gameLoopRef.current = requestAnimationFrame(gameLoop);
    
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, []); // This empty dependency array is crucial. The loop runs once and never stops.

  // Reset spawn timer when the game starts
  useEffect(() => {
    if (gameState === 'playing') {
      lastSpawnTimeRef.current = performance.now();
    }
  }, [gameState]);

  if (gameState === 'intro') {
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">붕어빵 탑 쌓기</h2>
        <p className="text-stone-700 text-lg mb-6">떨어지는 붕어빵을 접시로 받아 가장 높은 탑을 만드세요. 3개를 놓치면 게임이 끝납니다!</p>
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
  
  const BungeoppangIcon: React.FC<{crustLevel?: number}> = (props) => <ICONS.BUNGEOPPANG {...props} />;
  const PlateIcon: React.FC = () => <ICONS.PLATE />;

  return (
    <div className="bg-amber-200/80 p-4 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg flex flex-col">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-amber-800">붕어빵 탑 쌓기</h2>
        <div className="text-lg font-bold text-green-700">점수: {score}</div>
        <div className="text-lg font-bold text-red-700">기회: {'❤️'.repeat(lives)}</div>
      </div>
      <div
        ref={gameAreaRef}
        className="relative bg-sky-300 overflow-hidden w-full border-4 border-slate-700 cursor-none"
        style={{ width: '100%', aspectRatio: `${GAME_WIDTH}/${GAME_HEIGHT}` }}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
      >
        <svg viewBox={`0 0 ${GAME_WIDTH} ${GAME_HEIGHT}`} className="absolute inset-0 w-full h-full">
            <foreignObject x={plateX} y={GAME_HEIGHT - PLATE_HEIGHT} width={PLATE_WIDTH} height={PLATE_HEIGHT}>
                <PlateIcon />
            </foreignObject>
            
            {stackedItems.map(item => (
                <foreignObject key={item.id} x={item.x} y={item.y} width={BUN_WIDTH} height={BUN_HEIGHT}>
                   <BungeoppangIcon crustLevel={1}/>
                </foreignObject>
            ))}

            {items.map(item => (
                <foreignObject key={item.id} x={item.x} y={item.y} width={BUN_WIDTH} height={BUN_HEIGHT}>
                   <BungeoppangIcon crustLevel={1}/>
                </foreignObject>
            ))}
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

export default BungeoppangStackingMiniGame;