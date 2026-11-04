import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { ICONS } from '../constants';
import { FillingType } from '../types';

interface BungeoppangMazeMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const MAZE_WIDTH = 15;
const MAZE_HEIGHT = 10;
const GAME_TIME = 60; // seconds
const BONUS_PER_SECOND = 100;
const MAX_BONUS = 5000;
const MOVE_COOLDOWN = 120; // ms between moves for continuous movement

type Cell = {
  x: number;
  y: number;
  walls: { top: boolean; right: boolean; bottom: boolean; left: boolean };
  visited: boolean;
};

type Position = { x: number; y: number };

const generateMaze = (width: number, height: number): Cell[][] => {
  const maze: Cell[][] = Array.from({ length: height }, (_, y) =>
    Array.from({ length: width }, (_, x) => ({
      x,
      y,
      walls: { top: true, right: true, bottom: true, left: true },
      visited: false,
    }))
  );

  const stack: Position[] = [];
  const startPos = { x: 0, y: 0 };
  maze[startPos.y][startPos.x].visited = true;
  stack.push(startPos);

  while (stack.length > 0) {
    const current = stack[stack.length - 1];
    const neighbors = [];

    // Check neighbors
    if (current.y > 0 && !maze[current.y - 1][current.x].visited) neighbors.push({ x: current.x, y: current.y - 1, dir: 'top' });
    if (current.x < width - 1 && !maze[current.y][current.x + 1].visited) neighbors.push({ x: current.x + 1, y: current.y, dir: 'right' });
    if (current.y < height - 1 && !maze[current.y + 1][current.x].visited) neighbors.push({ x: current.x, y: current.y + 1, dir: 'bottom' });
    if (current.x > 0 && !maze[current.y][current.x - 1].visited) neighbors.push({ x: current.x - 1, y: current.y, dir: 'left' });

    if (neighbors.length > 0) {
      const next = neighbors[Math.floor(Math.random() * neighbors.length)];
      
      // Remove walls
      if (next.dir === 'top') {
        maze[current.y][current.x].walls.top = false;
        maze[next.y][next.x].walls.bottom = false;
      } else if (next.dir === 'right') {
        maze[current.y][current.x].walls.right = false;
        maze[next.y][next.x].walls.left = false;
      } else if (next.dir === 'bottom') {
        maze[current.y][current.x].walls.bottom = false;
        maze[next.y][next.x].walls.top = false;
      } else if (next.dir === 'left') {
        maze[current.y][current.x].walls.left = false;
        maze[next.y][next.x].walls.right = false;
      }
      
      maze[next.y][next.x].visited = true;
      stack.push({ x: next.x, y: next.y });
    } else {
      stack.pop();
    }
  }
  return maze;
};

const BungeoppangMazeMiniGame: React.FC<BungeoppangMazeMiniGameProps> = ({ onGameEnd }) => {
  const [maze, setMaze] = useState<Cell[][] | null>(null);
  const [playerPos, setPlayerPos] = useState<Position>({ x: 0, y: 0 });
  const [goalPos] = useState<Position>({ x: MAZE_WIDTH - 1, y: MAZE_HEIGHT - 1 });
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [gameState, setGameState] = useState<'intro' | 'playing' | 'end'>('intro');
  const [bonus, setBonus] = useState(0);

  const keysPressedRef = useRef<Record<string, boolean>>({});
  const lastMoveTimeRef = useRef<number>(0);
  const gameLoopRef = useRef<number>();

  useEffect(() => {
    setMaze(generateMaze(MAZE_WIDTH, MAZE_HEIGHT));
  }, []);

  useEffect(() => {
    if (gameState === 'playing' && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(t => t - 1), 1000);
      return () => clearTimeout(timer);
    }
    if (timeLeft <= 0 && gameState === 'playing') {
        setBonus(0);
        setGameState('end');
    }
  }, [timeLeft, gameState]);

  useEffect(() => {
    if (gameState === 'playing' && playerPos.x === goalPos.x && playerPos.y === goalPos.y) {
        setBonus(Math.min(MAX_BONUS, timeLeft * BONUS_PER_SECOND));
        setGameState('end');
    }
  }, [playerPos, goalPos, gameState, timeLeft]);

  // Setup keyboard listeners for continuous movement
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        keysPressedRef.current[e.key] = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressedRef.current[e.key] = false;
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop for handling movement
  useEffect(() => {
    if (gameState !== 'playing' || !maze) {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
      return;
    }

    const loop = (timestamp: number) => {
      if (timestamp - lastMoveTimeRef.current > MOVE_COOLDOWN) {
        let dx = 0;
        let dy = 0;

        if (keysPressedRef.current['ArrowUp']) dy = -1;
        else if (keysPressedRef.current['ArrowDown']) dy = 1;
        else if (keysPressedRef.current['ArrowLeft']) dx = -1;
        else if (keysPressedRef.current['ArrowRight']) dx = 1;

        if (dx !== 0 || dy !== 0) {
          setPlayerPos(currentPos => {
            const { x, y } = currentPos;
            const cell = maze[y][x];

            let canMove = false;
            if (dx === 1 && !cell.walls.right) canMove = true;
            if (dx === -1 && !cell.walls.left) canMove = true;
            if (dy === 1 && !cell.walls.bottom) canMove = true;
            if (dy === -1 && !cell.walls.top) canMove = true;

            if (canMove) {
              lastMoveTimeRef.current = timestamp;
              return { x: x + dx, y: y + dy };
            }
            return currentPos;
          });
        }
      }
      gameLoopRef.current = requestAnimationFrame(loop);
    };
    gameLoopRef.current = requestAnimationFrame(loop);

    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [gameState, maze]);


  const renderMaze = () => {
    if (!maze) return <div className="w-full h-full bg-slate-700 animate-pulse" />;

    const cellWidth = 100 / MAZE_WIDTH;
    const cellHeight = 100 / MAZE_HEIGHT;
    const GoalIcon = ICONS[FillingType.RED_BEAN];

    return (
      <div className="relative w-full h-full bg-amber-100 p-1">
        {maze.flat().map(cell => (
          <div
            key={`${cell.x}-${cell.y}`}
            className="absolute bg-amber-200/50"
            style={{
              left: `${cell.x * cellWidth}%`,
              top: `${cell.y * cellHeight}%`,
              width: `${cellWidth}%`,
              height: `${cellHeight}%`,
              borderTop: cell.walls.top ? '2px solid #a16207' : 'none',
              borderRight: cell.walls.right ? '2px solid #a16207' : 'none',
              borderBottom: cell.walls.bottom ? '2px solid #a16207' : 'none',
              borderLeft: cell.walls.left ? '2px solid #a16207' : 'none',
              boxSizing: 'border-box',
            }}
          />
        ))}
        <div
          className="absolute transition-all duration-100 ease-linear"
          style={{
            left: `${playerPos.x * cellWidth}%`,
            top: `${playerPos.y * cellHeight}%`,
            width: `${cellWidth}%`,
            height: `${cellHeight}%`,
          }}
        >
            <ICONS.BUNGEOPPANG crustLevel={1} />
        </div>
        <div
          className="absolute"
          style={{
            left: `${goalPos.x * cellWidth}%`,
            top: `${goalPos.y * cellHeight}%`,
            width: `${cellWidth}%`,
            height: `${cellHeight}%`,
          }}
        >
            <GoalIcon />
        </div>
      </div>
    );
  };

  const ControlButton: React.FC<{ children: React.ReactNode; directionKey: string }> = ({ children, directionKey }) => {
    const handlePress = () => {
        if (gameState !== 'playing') return;
        keysPressedRef.current[directionKey] = true;
    };
    const handleRelease = () => {
        keysPressedRef.current[directionKey] = false;
    };
    return (
      <button
        onMouseDown={handlePress}
        onMouseUp={handleRelease}
        onMouseLeave={handleRelease}
        onTouchStart={handlePress}
        onTouchEnd={handleRelease}
        className="w-16 h-16 bg-slate-500 text-white font-bold text-3xl rounded-full shadow-md active:bg-slate-600 active:scale-95 transition-all"
      >
        {children}
      </button>
    );
  };

  if (gameState === 'intro') {
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg text-center flex flex-col items-center">
        <h2 className="text-3xl font-bold text-amber-800 mb-4">붕어빵 미로 찾기</h2>
        <p className="text-stone-700 text-lg mb-6">미로를 탈출하여 맛있는 팥을 찾아가세요! 시간이 지날수록 보너스가 줄어듭니다.</p>
        <button
          onClick={() => setGameState('playing')}
          className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
        >
          도전 시작!
        </button>
      </div>
    );
  }

  if (gameState === 'end') {
    return (
      <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg text-center flex flex-col items-center">
        <h2 className="text-4xl font-bold text-amber-800 mb-4">{bonus > 0 ? '탈출 성공!' : '시간 초과!'}</h2>
        <p className="text-2xl text-stone-700 mb-2">{bonus > 0 ? `남은 시간: ${timeLeft}초` : '미로 탈출에 실패했습니다.'}</p>
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
    <div className="bg-amber-200/80 p-4 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-4xl flex flex-col items-center">
      <div className="w-full flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-amber-800">미로 탈출!</h2>
        <div className="text-xl font-bold text-stone-700">남은 시간: {timeLeft}s</div>
      </div>

      <div className="w-full" style={{ aspectRatio: `${MAZE_WIDTH} / ${MAZE_HEIGHT}` }}>
        {renderMaze()}
      </div>

      <div className="mt-4 grid grid-cols-3 gap-2 w-56">
        <div />
        <ControlButton directionKey="ArrowUp">▲</ControlButton>
        <div />
        <ControlButton directionKey="ArrowLeft">◀</ControlButton>
        <div />
        <ControlButton directionKey="ArrowRight">▶</ControlButton>
        <div />
        <ControlButton directionKey="ArrowDown">▼</ControlButton>
        <div />
      </div>
    </div>
  );
};

export default BungeoppangMazeMiniGame;