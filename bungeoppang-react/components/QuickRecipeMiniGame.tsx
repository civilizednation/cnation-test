import React, { useState, useEffect, useCallback } from 'react';
import { FillingType } from '../types';
import { ICONS, FILLING_DETAILS } from '../constants';

interface QuickRecipeMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const FILLINGS_IN_GAME = Object.values(FillingType);
const MAX_ROUNDS = 10;
const STARTING_SEQUENCE_LENGTH = 3;
const BONUS_PER_ROUND = 500;
const INITIAL_LIVES = 3;

const QuickRecipeMiniGame: React.FC<QuickRecipeMiniGameProps> = ({ onGameEnd }) => {
  const [sequence, setSequence] = useState<FillingType[]>([]);
  const [playerInput, setPlayerInput] = useState<FillingType[]>([]);
  const [gameState, setGameState] = useState<'intro' | 'showing' | 'playing' | 'feedback' | 'end'>('intro');
  const [round, setRound] = useState(1);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);

  const generateSequence = useCallback(() => {
    const length = STARTING_SEQUENCE_LENGTH + round - 1;
    const newSequence: FillingType[] = [];
    for (let i = 0; i < length; i++) {
      newSequence.push(FILLINGS_IN_GAME[Math.floor(Math.random() * FILLINGS_IN_GAME.length)]);
    }
    setSequence(newSequence);
  }, [round]);

  useEffect(() => {
    if (gameState === 'showing') {
        const showTime = 1000 + sequence.length * 400; // Time to memorize
        const timer = window.setTimeout(() => {
            setGameState('playing');
        }, showTime);
        return () => window.clearTimeout(timer);
    }
    
    if (gameState === 'feedback') {
        const timer = window.setTimeout(() => {
            setFeedback(null);
            if(lives > 0 && round < MAX_ROUNDS) {
                setRound(r => r + 1);
                setGameState('showing');
            } else {
                setGameState('end');
            }
        }, 1000);
        return () => window.clearTimeout(timer);
    }
  }, [gameState, sequence.length, lives, round]);

  useEffect(() => {
    if (round > 1) { // generate new sequence for subsequent rounds
      generateSequence();
    }
  }, [round, generateSequence]);


  const handlePlayerChoice = (filling: FillingType) => {
    if (gameState !== 'playing') return;

    const newPlayerInput = [...playerInput, filling];
    setPlayerInput(newPlayerInput);

    if (newPlayerInput[newPlayerInput.length - 1] !== sequence[newPlayerInput.length - 1]) {
      // Wrong input
      setFeedback('wrong');
      setLives(l => l - 1);
      setPlayerInput([]);
      setGameState('feedback');
      return;
    }

    if (newPlayerInput.length === sequence.length) {
      // Correct sequence
      setFeedback('correct');
      setPlayerInput([]);
      setGameState('feedback');
    }
  };
  
  const startGame = () => {
    generateSequence();
    setGameState('showing');
  }

  const score = (round - 1) * BONUS_PER_ROUND;

  const renderContent = () => {
    switch (gameState) {
      case 'intro':
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-amber-800 mb-4">레시피 암기 챌린지</h2>
            <p className="text-stone-700 text-lg mb-6">VIP 손님의 비밀 레시피를 기억하세요! 순서대로 속 재료를 선택해야 합니다.</p>
            <button
              onClick={startGame}
              className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
            >
              도전 시작!
            </button>
          </div>
        );
      case 'end':
        return (
            <div className="text-center">
              <h2 className="text-4xl font-bold text-amber-800 mb-4">게임 종료!</h2>
              <p className="text-2xl text-stone-700 mb-2">최종 라운드: {round - 1}</p>
              <p className="text-xl text-green-600 font-bold mb-6">획득 보너스: ₩{score.toLocaleString()}</p>
              <button
                onClick={() => onGameEnd(score)}
                className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
              >
                가게로 돌아가기
              </button>
            </div>
          );
      default:
        return (
          <>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-amber-800">Round {round}</h2>
              <div className="text-lg font-bold text-red-700">남은 기회: {'❤️'.repeat(lives)}</div>
            </div>
            
            <div className="w-full h-20 bg-white/50 my-4 rounded-lg flex items-center justify-center gap-2 p-2 border-2 border-amber-300">
                {gameState === 'showing' && sequence.map((filling, index) => {
                    const Icon = ICONS[filling];
                    return <div key={index} className="w-14 h-14 animate-pop-in-subtle"><Icon/></div>
                })}
                {gameState === 'playing' && playerInput.map((filling, index) => {
                     const Icon = ICONS[filling];
                     return <div key={index} className="w-14 h-14"><Icon/></div>
                })}
                {gameState === 'playing' && <div className="w-10 h-10 rounded-full bg-slate-400 animate-pulse" />}
                {feedback === 'correct' && <div className="text-5xl text-green-500">✅</div>}
                {feedback === 'wrong' && <div className="text-5xl text-red-500">❌</div>}
            </div>

            <p className="text-center font-semibold text-stone-600 mb-4">
                {gameState === 'showing' && '레시피를 외우세요!'}
                {gameState === 'playing' && '순서대로 선택하세요!'}
            </p>

            <div className="grid grid-cols-4 gap-2">
                {FILLINGS_IN_GAME.map(filling => {
                    // FIX: Cast string enum value to FillingType for safe access.
                    const fillingType = filling as FillingType;
                    const Icon = ICONS[fillingType];
                    const details = FILLING_DETAILS[fillingType];
                    return (
                        <button 
                            key={fillingType}
                            onClick={() => handlePlayerChoice(fillingType)}
                            disabled={gameState !== 'playing'}
                            className="flex flex-col items-center justify-center p-2 rounded-lg border-2 border-amber-400 bg-amber-100 h-24 transition-transform active:scale-95 disabled:opacity-50 hover:bg-amber-200"
                        >
                            <div className="w-12 h-12"><Icon/></div>
                            <span className={`text-xs font-bold ${details.textColor}`}>{details.label}</span>
                        </button>
                    )
                })}
            </div>
          </>
        );
    }
  }

  return (
    <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-lg flex flex-col">
        {renderContent()}
    </div>
  );
};

export default QuickRecipeMiniGame;
