import React, { useState, useMemo } from 'react';

// Game constants
const PRIZES = [5000, 0, 1000, 0];

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

// Component props
interface RandomDrawMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const RandomDrawMiniGame: React.FC<RandomDrawMiniGameProps> = ({ onGameEnd }) => {
  const [revealedBox, setRevealedBox] = useState<number | null>(null);
  const shuffledPrizes = useMemo(() => shuffleArray(PRIZES), []);

  const handleSelectBox = (index: number) => {
    if (revealedBox !== null) return;
    
    window.setTimeout(() => {
        setRevealedBox(index);
    }, 300);
  };

  const bonus = revealedBox !== null ? shuffledPrizes[revealedBox] : 0;

  return (
    <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-2xl relative text-center">
      <h2 className="text-3xl font-bold text-amber-800 mb-4">무작위 뽑기</h2>
      <p className="text-stone-700 text-lg mb-8">
        {revealedBox === null ? '상자를 선택해 보너스를 찾아보세요!' : (bonus > 0 ? '보너스 획득!' : '아쉽네요!')}
      </p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-8">
        {shuffledPrizes.map((prize, index) => {
          const isRevealed = revealedBox !== null;
          const isChosen = revealedBox === index;
          const hasPrize = prize > 0;

          return (
            <div
              key={index}
              className={`h-32 rounded-lg flex items-center justify-center text-5xl transform transition-all duration-300 ${isRevealed ? '' : 'cursor-pointer hover:scale-105'}`}
              onClick={() => handleSelectBox(index)}
            >
              <div className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${isChosen ? 'rotate-y-180' : ''}`}>
                {/* Box Back */}
                <div className="absolute w-full h-full backface-hidden flex items-center justify-center bg-amber-500 rounded-lg shadow-md border-4 border-amber-700 text-white">
                    🎁
                </div>
                {/* Box Front (Content) */}
                <div className={`absolute w-full h-full backface-hidden rotate-y-180 flex items-center justify-center rounded-lg shadow-inner border-4 ${hasPrize ? 'bg-yellow-200 border-yellow-400' : 'bg-stone-200 border-stone-400'}`}>
                    <span className="text-2xl font-bold">{hasPrize ? `+₩${prize}` : '꽝'}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {revealedBox !== null && (
        <div className="animate-customer-pop-in mt-8">
          <p className="text-xl text-stone-700 mb-6">
            {bonus > 0 ? `축하합니다! ₩${bonus.toLocaleString()} 보너스를 획득했습니다.` : '아쉽지만 다음 기회에!'}
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
  );
};

export default RandomDrawMiniGame;