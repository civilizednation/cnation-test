import React, { useState, useEffect } from 'react';
import { FillingType } from '../types';
import { ICONS, FILLING_DETAILS } from '../constants';

interface MatchingMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

interface Card {
  id: number;
  filling: FillingType;
  isFlipped: boolean;
  isMatched: boolean;
}

const shuffleArray = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

const fillingsForGame: FillingType[] = [
  FillingType.RED_BEAN,
  FillingType.CHOUX_CREAM,
  FillingType.PIZZA,
  FillingType.SWEET_POTATO,
  FillingType.CHOCOLATE,
  FillingType.STRAWBERRY,
];

const generateCards = (): Card[] => {
  const doubledFillings = [...fillingsForGame, ...fillingsForGame];
  return shuffleArray(doubledFillings).map((filling, index) => ({
    id: index,
    filling,
    isFlipped: false,
    isMatched: false,
  }));
};

const BONUS_REWARD = 5000;
const MAX_TRIES = 10;

const MatchingMiniGame: React.FC<MatchingMiniGameProps> = ({ onGameEnd }) => {
  const [cards, setCards] = useState<Card[]>(generateCards());
  const [flippedIndices, setFlippedIndices] = useState<number[]>([]);
  const [tries, setTries] = useState<number>(MAX_TRIES);
  const [isChecking, setIsChecking] = useState<boolean>(false);
  const [gameOver, setGameOver] = useState<'won' | 'lost' | null>(null);

  useEffect(() => {
    if (flippedIndices.length === 2) {
      setIsChecking(true);
      const [firstIndex, secondIndex] = flippedIndices;
      const firstCard = cards[firstIndex];
      const secondCard = cards[secondIndex];

      if (firstCard.filling === secondCard.filling) {
        // Match
        window.setTimeout(() => {
          setCards(prev =>
            prev.map(card =>
              card.filling === firstCard.filling ? { ...card, isMatched: true } : card
            )
          );
          setFlippedIndices([]);
          setIsChecking(false);
        }, 800);
      } else {
        // No match
        setTries(prev => prev - 1);
        window.setTimeout(() => {
          setCards(prev =>
            prev.map((card, index) =>
              index === firstIndex || index === secondIndex ? { ...card, isFlipped: false } : card
            )
          );
          setFlippedIndices([]);
          setIsChecking(false);
        }, 1200);
      }
    }
  }, [flippedIndices, cards]);

  useEffect(() => {
    if (cards.every(card => card.isMatched)) {
      setGameOver('won');
    } else if (tries <= 0) {
      setGameOver('lost');
    }
  }, [cards, tries]);

  const handleCardClick = (index: number) => {
    if (isChecking || flippedIndices.length === 2 || cards[index].isFlipped || cards[index].isMatched) {
      return;
    }
    setCards(prev =>
      prev.map((card, i) => (i === index ? { ...card, isFlipped: true } : card))
    );
    setFlippedIndices(prev => [...prev, index]);
  };

  const CardComponent: React.FC<{ card: Card; index: number }> = ({ card, index }) => {
    const BungeoppangIcon = ICONS.BUNGEOPPANG;
    const FillingIcon = ICONS[card.filling];
    
    return (
        <div
          className="w-24 h-28 sm:w-28 sm:h-36 perspective-1000"
          onClick={() => handleCardClick(index)}
        >
          <div
            className={`relative w-full h-full transform-style-3d transition-transform duration-500 ${card.isFlipped ? 'rotate-y-180' : ''} ${card.isMatched ? 'opacity-50' : ''} ${!gameOver && !card.isMatched ? 'cursor-pointer' : ''}`}
          >
            {/* Card Back */}
            <div className="absolute w-full h-full backface-hidden flex items-center justify-center bg-slate-700 rounded-lg shadow-md border-2 border-slate-800">
              <div className="w-2/3 h-2/3 text-slate-400">
                <BungeoppangIcon />
              </div>
            </div>
            {/* Card Front */}
            <div className="absolute w-full h-full backface-hidden rotate-y-180 flex flex-col items-center justify-center bg-amber-100 rounded-lg shadow-md border-2 border-amber-400 p-2">
                <div className="w-16 h-16">
                    <FillingIcon />
                </div>
                <p className={`font-bold text-sm ${FILLING_DETAILS[card.filling].textColor}`}>
                    {FILLING_DETAILS[card.filling].label}
                </p>
            </div>
          </div>
        </div>
      );
  };

  return (
    <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-2xl relative">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-amber-800">붕어빵 짝 맞추기</h2>
        <div className="text-xl font-bold text-stone-700">남은 횟수: {tries}</div>
      </div>

      <div className="grid grid-cols-4 gap-4 justify-items-center">
        {cards.map((card, index) => (
          <CardComponent key={card.id} card={card} index={index} />
        ))}
      </div>
      
      {gameOver && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-xl animate-customer-pop-in">
          <h2 className={`text-5xl font-bold mb-4 ${gameOver === 'won' ? 'text-yellow-300' : 'text-red-400'}`}>
            {gameOver === 'won' ? '🎉 성공! 🎉' : '😭 실패 😭'}
          </h2>
          <p className="text-white text-xl mb-6">
            {gameOver === 'won' ? `보너스 ₩${BONUS_REWARD.toLocaleString()} 획득!` : '아쉽지만 보너스는 다음 기회에!'}
          </p>
          <button
            onClick={() => onGameEnd(gameOver === 'won' ? BONUS_REWARD : 0)}
            className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
          >
            가게로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
};

export default MatchingMiniGame;