import React, { useState, useEffect } from 'react';

// Game constants
const CHOICES = ['rock', 'paper', 'scissors'] as const;
type Choice = typeof CHOICES[number];
const EMOJIS: Record<Choice, string> = { rock: '✊', paper: '🖐️', scissors: '✌️' };
const MAX_ROUNDS = 3;
const OPPONENT_ICON = '😎'; // Tazza

// Component props
interface RPSMiniGameProps {
  onGameEnd: (bonus: number) => void;
}

const RPSMiniGame: React.FC<RPSMiniGameProps> = ({ onGameEnd }) => {
  const [playerScore, setPlayerScore] = useState(0);
  const [opponentScore, setOpponentScore] = useState(0);
  const [currentRound, setCurrentRound] = useState(1);
  const [playerChoice, setPlayerChoice] = useState<Choice | null>(null);
  const [opponentChoice, setOpponentChoice] = useState<Choice | null>(null);
  const [resultMessage, setResultMessage] = useState('가위바위보!');
  const [isRoundOver, setIsRoundOver] = useState(false);

  const isGameOver = currentRound > MAX_ROUNDS;

  const handlePlayerChoice = (choice: Choice) => {
    if (isRoundOver || isGameOver) return;

    const opponentRandomChoice = CHOICES[Math.floor(Math.random() * CHOICES.length)];

    setPlayerChoice(choice);
    setOpponentChoice(null); // Hide opponent's choice for a moment
    setResultMessage('...');
    setIsRoundOver(true);

    window.setTimeout(() => {
        setOpponentChoice(opponentRandomChoice);

        // Determine winner
        let roundWinner: 'player' | 'opponent' | 'draw' = 'draw';
        if (choice === opponentRandomChoice) {
          roundWinner = 'draw';
        } else if (
          (choice === 'rock' && opponentRandomChoice === 'scissors') ||
          (choice === 'scissors' && opponentRandomChoice === 'paper') ||
          (choice === 'paper' && opponentRandomChoice === 'rock')
        ) {
          roundWinner = 'player';
        } else {
          roundWinner = 'opponent';
        }

        // Update score and message
        if (roundWinner === 'player') {
          setPlayerScore(s => s + 1);
          setResultMessage('승리!');
        } else if (roundWinner === 'opponent') {
          setOpponentScore(s => s + 1);
          setResultMessage('패배...');
        } else {
          setResultMessage('무승부!');
        }

        // Move to next round
        window.setTimeout(() => {
            setCurrentRound(r => r + 1);
            setPlayerChoice(null);
            setOpponentChoice(null);
            setResultMessage('가위바위보!');
            setIsRoundOver(false);
        }, 1500);

    }, 500); // Suspense delay
  };

  const getBonus = () => {
    if (playerScore > opponentScore) return 5000;
    if (playerScore === opponentScore) return 1500;
    return 0;
  };
  
  const getFinalMessage = () => {
    if (playerScore > opponentScore) return '최종 승리!';
    if (playerScore < opponentScore) return '최종 패배...';
    return '최종 무승부!';
  }

  if (isGameOver) {
    return (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center rounded-xl animate-customer-pop-in z-20">
            <h2 className={`text-5xl font-bold mb-4 ${playerScore > opponentScore ? 'text-yellow-300' : (playerScore < opponentScore ? 'text-red-400' : 'text-white')}`}>
                {getFinalMessage()}
            </h2>
            <p className="text-white text-xl mb-6">
                {getBonus() > 0 ? `보너스 ₩${getBonus().toLocaleString()} 획득!` : '아쉽지만 보너스는 없습니다.'}
            </p>
            <button
                onClick={() => onGameEnd(getBonus())}
                className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
            >
                가게로 돌아가기
            </button>
        </div>
    );
  }

  return (
    <div className="bg-amber-200/80 p-6 rounded-xl shadow-inner border-2 border-amber-300 w-full max-w-2xl relative">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-amber-800">가위바위보 대결</h2>
            <div className="text-xl font-bold text-stone-700">Round {currentRound} / {MAX_ROUNDS}</div>
        </div>
        
        {/* Scoreboard */}
        <div className="flex justify-around items-center mb-8 text-2xl font-bold">
            <div className="text-blue-600">나: {playerScore}</div>
            <div className="text-red-600">상대: {opponentScore}</div>
        </div>

        {/* Game Area */}
        <div className="flex justify-around items-center h-40 mb-8">
            {/* Player */}
            <div className="flex flex-col items-center gap-4">
                <span className="text-lg font-semibold">나</span>
                <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center text-5xl border-4 border-blue-300">
                    {playerChoice ? EMOJIS[playerChoice] : '?'}
                </div>
            </div>

            <div className="text-3xl font-bold self-center">{resultMessage}</div>

            {/* Opponent */}
            <div className="flex flex-col items-center gap-4">
                <span className="text-lg font-semibold">상대 {OPPONENT_ICON}</span>
                <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center text-5xl border-4 border-red-300">
                    {opponentChoice ? EMOJIS[opponentChoice] : '?'}
                </div>
            </div>
        </div>

        {/* Player Controls */}
        <div className="flex justify-center gap-4">
            {CHOICES.map(choice => (
                <button
                    key={choice}
                    onClick={() => handlePlayerChoice(choice)}
                    disabled={isRoundOver || isGameOver}
                    className="w-24 h-24 bg-green-500 text-white rounded-full text-5xl flex items-center justify-center font-bold shadow-lg hover:bg-green-600 transform hover:scale-110 transition-all disabled:bg-gray-400 disabled:scale-100"
                >
                    {EMOJIS[choice]}
                </button>
            ))}
        </div>
    </div>
  );
};

export default RPSMiniGame;