import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';

// --- Game constants & helpers ---
const LADDER_COUNT = 5;
const LADDER_HEIGHT_STEPS = 12;
const PRIZES = [0, 1000, 2000, 5000, 10000];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

type Rung = { from: number; to: number; y: number };

const generateRungs = (): Rung[] => {
    const rungs: Rung[] = [];
    // For each possible vertical gap (0-1, 1-2, etc.), add some rungs at random heights.
    for (let i = 0; i < LADDER_COUNT - 1; i++) {
        const availableLevels = Array.from({ length: LADDER_HEIGHT_STEPS - 3 }, (_, k) => k + 2); // Levels 2 to 10
        const rungCount = 2 + Math.floor(Math.random() * 2); // 2 or 3 rungs

        for (let j = 0; j < rungCount; j++) {
            if (availableLevels.length === 0) break;
            const levelIndex = Math.floor(Math.random() * availableLevels.length);
            const level = availableLevels[levelIndex];
            
            // Remove level and adjacent levels to prevent rungs from being too close vertically
            availableLevels.splice(Math.max(0, levelIndex - 1), 3);

            rungs.push({ from: i, to: i + 1, y: level });
        }
    }
    // Sort rungs by y-level for easier processing
    return rungs.sort((a, b) => a.y - b.y);
};

// --- Prop definitions ---
interface LadderMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

// --- Component ---
const LadderMiniGame: React.FC<LadderMiniGameProps> = ({ onGameEnd }) => {
  const [gameState, setGameState] = useState<'select' | 'animate' | 'result'>('select');
  const [selectedStart, setSelectedStart] = useState<number | null>(null);
  const [endPoint, setEndPoint] = useState<number | null>(null);
  const [finalPrize, setFinalPrize] = useState<number | null>(null);
  const [pathData, setPathData] = useState('');
  
  const pathRef = useRef<SVGPathElement>(null);

  const shuffledPrizes = useMemo(() => shuffleArray(PRIZES), []);
  const rungs = useMemo(() => generateRungs(), []);

  const calculatePath = useCallback((startLine: number) => {
    let currentLine = startLine;
    const yStep = 100 / (LADDER_HEIGHT_STEPS + 1);
    const xStep = 100 / (LADDER_COUNT - 1);
    let path = `M ${startLine * xStep},0 V ${yStep}`;

    for (let y = 1; y <= LADDER_HEIGHT_STEPS; y++) {
      const rung = rungs.find(r => r.y === y && (r.from === currentLine || r.to === currentLine));
      path += ` V ${y * yStep}`;
      if (rung) {
        const nextLine = rung.from === currentLine ? rung.to : rung.from;
        path += ` H ${nextLine * xStep}`;
        currentLine = nextLine;
        path += ` V ${(y + 1) * yStep}`;
      }
    }
    path += ` V ${(LADDER_HEIGHT_STEPS + 1) * yStep}`;
    return { path, endLine: currentLine };
  }, [rungs]);

  const handleSelect = (startLine: number) => {
    if (gameState !== 'select') return;
    setSelectedStart(startLine);
    const { path, endLine } = calculatePath(startLine);
    setPathData(path);
    setEndPoint(endLine);
    setFinalPrize(shuffledPrizes[endLine]);
    setGameState('animate');
  };

  useEffect(() => {
    if (gameState === 'animate') {
      const animationDuration = 3000;
      const timer = window.setTimeout(() => {
        setGameState('result');
      }, animationDuration);
      return () => window.clearTimeout(timer);
    }
  }, [gameState, finalPrize]);

  return (
    <div className="bg-amber-200/80 p-4 sm:p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-2xl relative text-center flex flex-col">
      <h2 className="text-2xl sm:text-3xl font-bold text-amber-800 mb-2">운명의 사다리 타기</h2>
      <p className="text-stone-700 text-lg mb-4">
        {gameState === 'select' && '출발점을 선택하세요!'}
        {gameState === 'animate' && '두근두근... 과연 결과는?'}
        {gameState === 'result' && (finalPrize != null && finalPrize > 0 ? `보너스 ₩${finalPrize.toLocaleString()} 획득!` : '아쉽지만, 꽝!')}
      </p>

      <div className="flex-grow w-full max-w-lg mx-auto flex flex-col">
        {/* Starters */}
        <div className="flex justify-around">
            {Array.from({ length: LADDER_COUNT }).map((_, i) => (
                <button 
                    key={i} 
                    onClick={() => handleSelect(i)} 
                    disabled={gameState !== 'select'}
                    className={`w-12 h-12 sm:w-16 sm:h-16 rounded-full flex items-center justify-center font-bold text-xl sm:text-2xl border-4 transition-all
                    ${selectedStart === i ? 'bg-orange-500 border-orange-700 text-white scale-110' : 'bg-green-500 border-green-700 text-white'}
                    ${gameState === 'select' ? 'hover:bg-green-600 cursor-pointer' : 'cursor-default'}`}
                >
                    {i + 1}
                </button>
            ))}
        </div>
        
        {/* Ladder SVG */}
        <div className="flex-grow my-2">
            <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
                {/* Vertical lines */}
                {Array.from({ length: LADDER_COUNT }).map((_, i) => (
                    <line key={i} x1={i * (100 / (LADDER_COUNT - 1))} y1="0" x2={i * (100 / (LADDER_COUNT - 1))} y2="100" stroke="#a16207" strokeWidth="1.5" />
                ))}
                {/* Rungs */}
                {rungs.map((rung, i) => (
                    <line 
                        key={i}
                        x1={rung.from * (100 / (LADDER_COUNT - 1))}
                        y1={rung.y * (100 / (LADDER_HEIGHT_STEPS + 1))}
                        x2={rung.to * (100 / (LADDER_COUNT - 1))}
                        y2={rung.y * (100 / (LADDER_HEIGHT_STEPS + 1))}
                        stroke="#a16207"
                        strokeWidth="1.5"
                    />
                ))}
                {/* Animated Path */}
                {gameState !== 'select' && (
                    <path
                        ref={pathRef}
                        d={pathData}
                        fill="none"
                        stroke="#ef4444"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="ladder-path"
                        style={{'--path-length': `${pathRef.current?.getTotalLength() || 0}px`} as React.CSSProperties}
                    />
                )}
            </svg>
        </div>

        {/* Prizes */}
        <div className="flex justify-around">
            {shuffledPrizes.map((prize, i) => (
                <div key={i} className={`w-20 h-10 sm:w-24 sm:h-12 rounded-lg flex items-center justify-center font-bold text-sm sm:text-base border-4 transition-all duration-500
                    ${gameState === 'result' && endPoint === i ? (prize > 0 ? 'bg-yellow-300 border-yellow-500 text-yellow-800 scale-110' : 'bg-stone-300 border-stone-500 text-stone-800 scale-110') : 'bg-amber-100 border-amber-400 text-amber-800'}`}
                >
                    {prize === 0 ? '꽝' : `₩${prize.toLocaleString()}`}
                </div>
            ))}
        </div>
      </div>
      
      {gameState === 'result' && finalPrize !== null && (
        <div className="animate-customer-pop-in mt-6">
          <button
            onClick={() => onGameEnd(finalPrize)}
            className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
          >
            가게로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};

export default LadderMiniGame;