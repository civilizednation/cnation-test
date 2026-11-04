import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ICONS } from '../constants';
import { FillingType } from '../types';

// Game constants
const GRID_SIZE = 20;
const INITIAL_SNAKE = [{ x: 8, y: 10 }, { x: 7, y: 10 }, { x: 6, y: 10 }];
const INITIAL_SPEED = 200; // ms per tick
const MIN_SPEED = 50;
const SPEED_INCREMENT = 5; // ms faster per food
const BONUS_PER_SCORE = 100;

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Position = { x: number; y: number };

// Component props
interface SnakeMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const getRandomPosition = (snake: Position[]): Position => {
    let position: Position;
    do {
        position = {
            x: Math.floor(Math.random() * GRID_SIZE),
            y: Math.floor(Math.random() * GRID_SIZE),
        };
    } while (snake.some(segment => segment.x === position.x && segment.y === position.y));
    return position;
};

const ControlButton: React.FC<{
  direction: Direction;
  onClick: (dir: Direction) => void;
  children: React.ReactNode;
  className?: string;
}> = ({ direction, onClick, children, className = '' }) => (
  <button
    onClick={() => onClick(direction)}
    className={`w-full aspect-square bg-slate-500 text-white font-bold text-2xl rounded-lg shadow-md active:bg-slate-600 active:scale-95 transition-all ${className}`}
    aria-label={`Move ${direction.toLowerCase()}`}
  >
    {children}
  </button>
);

const SnakeMiniGame: React.FC<SnakeMiniGameProps> = ({ onGameEnd }) => {
    const [snake, setSnake] = useState<Position[]>(INITIAL_SNAKE);
    const [food, setFood] = useState<Position>(getRandomPosition(INITIAL_SNAKE));
    const [direction, setDirection] = useState<Direction>('RIGHT');
    const [speed, setSpeed] = useState<number>(INITIAL_SPEED);
    const [score, setScore] = useState<number>(0);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [isPaused, setIsPaused] = useState<boolean>(true); // Start paused

    const directionRef = useRef(direction);
    directionRef.current = direction;

    const changeDirection = useCallback((newDirection: Direction) => {
        setIsPaused(false); // Start game on first input
        
        const currentDirection = directionRef.current;
        
        switch (newDirection) {
            case 'UP':
                if (currentDirection !== 'DOWN') setDirection('UP');
                break;
            case 'DOWN':
                if (currentDirection !== 'UP') setDirection('DOWN');
                break;
            case 'LEFT':
                if (currentDirection !== 'RIGHT') setDirection('LEFT');
                break;
            case 'RIGHT':
                if (currentDirection !== 'LEFT') setDirection('RIGHT');
                break;
        }
    }, []);

    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        const keyDirection = e.key.replace('Arrow', '').toUpperCase() as Direction;
        if (['UP', 'DOWN', 'LEFT', 'RIGHT'].includes(keyDirection)) {
             e.preventDefault(); // Prevent page scrolling
             changeDirection(keyDirection);
        }
    }, [changeDirection]);


    useEffect(() => {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handleKeyDown]);

    useEffect(() => {
        if (isGameOver || isPaused) return;

        const gameInterval = window.setInterval(() => {
            setSnake(prevSnake => {
                const newSnake = [...prevSnake];
                const head = { ...newSnake[0] };

                switch (direction) {
                    case 'UP': head.y -= 1; break;
                    case 'DOWN': head.y += 1; break;
                    case 'LEFT': head.x -= 1; break;
                    case 'RIGHT': head.x += 1; break;
                }

                // Wall collision
                if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
                    setIsGameOver(true);
                    return prevSnake;
                }

                // Self collision
                for (let i = 1; i < newSnake.length; i++) {
                    if (head.x === newSnake[i].x && head.y === newSnake[i].y) {
                        setIsGameOver(true);
                        return prevSnake;
                    }
                }
                
                newSnake.unshift(head);

                // Food collision
                if (head.x === food.x && head.y === food.y) {
                    setScore(s => s + 1);
                    setSpeed(s => Math.max(MIN_SPEED, s - SPEED_INCREMENT));
                    setFood(getRandomPosition(newSnake));
                } else {
                    newSnake.pop();
                }
                
                return newSnake;
            });
        }, speed);

        return () => window.clearInterval(gameInterval);
    }, [snake, direction, speed, isGameOver, food, isPaused]);

    const bonus = score * BONUS_PER_SCORE;
    const BungeoppangIcon = ICONS.BUNGEOPPANG;
    const FoodIcon = ICONS[FillingType.RED_BEAN];

    return (
        <div className="bg-amber-200/80 p-4 sm:p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg mx-auto relative flex flex-col">
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-amber-800">붕어빵 꼬리잡기</h2>
                <div className="text-xl font-bold text-stone-700">점수: {score}</div>
            </div>

            <div
                className="relative bg-slate-700 border-4 border-slate-800 rounded-lg shadow-inner"
                style={{
                    width: '100%',
                    aspectRatio: '1 / 1',
                }}
            >
                {/* Render Snake */}
                {snake.map((segment, index) => (
                    <div
                        key={index}
                        className="absolute"
                        style={{
                            left: `${segment.x * (100 / GRID_SIZE)}%`,
                            top: `${segment.y * (100 / GRID_SIZE)}%`,
                            width: `${100 / GRID_SIZE}%`,
                            height: `${100 / GRID_SIZE}%`,
                        }}
                    >
                         <div className={`w-full h-full text-amber-700 transition-transform duration-100 ${index === 0 ? 'scale-110' : ''}`}>
                            <BungeoppangIcon crustLevel={0} decorationLevel={0}/>
                        </div>
                    </div>
                ))}
                {/* Render Food */}
                <div
                    className="absolute"
                    style={{
                        left: `${food.x * (100 / GRID_SIZE)}%`,
                        top: `${food.y * (100 / GRID_SIZE)}%`,
                        width: `${100 / GRID_SIZE}%`,
                        height: `${100 / GRID_SIZE}%`,
                    }}
                >
                    <div className="w-full h-full animate-gentle-bob">
                        <FoodIcon />
                    </div>
                </div>

                {/* Game Overlay */}
                {(isGameOver || isPaused) && (
                    <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-lg animate-customer-pop-in p-4">
                        {isGameOver ? (
                            <>
                                <h2 className="text-5xl font-bold mb-4 text-red-400">게임 오버</h2>
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
                            </>
                        ) : (
                            <>
                                <h2 className="text-4xl font-bold mb-4 text-white">준비!</h2>
                                <p className="text-white text-xl text-center">화살표 키나 화면의 버튼을 눌러<br/>게임을 시작하세요.</p>
                            </>
                        )}
                    </div>
                )}
            </div>
            
             {/* Touch Controls */}
            <div className="mt-4 flex justify-center">
                <div className="grid grid-cols-3 gap-2 w-40 sm:w-48">
                    <div />
                    <ControlButton direction="UP" onClick={changeDirection}>▲</ControlButton>
                    <div />
                    <ControlButton direction="LEFT" onClick={changeDirection}>◀</ControlButton>
                    <div />
                    <ControlButton direction="RIGHT" onClick={changeDirection}>▶</ControlButton>
                    <div />
                    <ControlButton direction="DOWN" onClick={changeDirection}>▼</ControlButton>
                    <div />
                </div>
            </div>
        </div>
    );
};

export default SnakeMiniGame;