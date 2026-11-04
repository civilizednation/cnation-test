import React from 'react';
import { ICONS } from '../constants';
import { FillingType } from '../types';

interface TutorialModalProps {
    onClose: () => void;
}

const TutorialStep: React.FC<{
    step: number;
    icon: React.ReactNode;
    text: string;
}> = ({ step, icon, text }) => (
    <div className="flex items-center gap-4 group">
        <div className="flex-shrink-0 w-12 h-12 bg-amber-200 rounded-full flex items-center justify-center text-xl font-bold text-amber-800 border-2 border-amber-400">
            {step}
        </div>
        <div className="flex-grow flex items-center gap-3 text-lg text-stone-700">
            <div className="flex-shrink-0 w-10 h-10 transition-transform duration-300 group-hover:scale-110">{icon}</div>
            <p>{text}</p>
        </div>
    </div>
);

const TutorialModal: React.FC<TutorialModalProps> = ({ onClose }) => {
    
    const handleClose = () => {
        onClose();
    }
    
    const BungeoppangIcon = ICONS.BUNGEOPPANG;
    const RedBeanIcon = ICONS[FillingType.RED_BEAN];
    const ChouxCreamIcon = ICONS[FillingType.CHOUX_CREAM];

    const WonBagIcon = () => (
        <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
            <defs>
                <linearGradient id="wonBagGrad" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#facc15" />
                    <stop offset="100%" stopColor="#ca8a04" />
                </linearGradient>
                <filter id="wonBagShadow">
                    <feDropShadow dx="1" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.2"/>
                </filter>
            </defs>
            <g filter="url(#wonBagShadow)">
                <path d="M5 20 C5 12, 3 7, 7 6 C 9 5, 15 5, 17 6 C 21 7, 19 12, 19 20 Z" fill="#854d0e" />
                <path d="M5 20 C5 14, 2 10, 7 8 C 9 7, 15 7, 17 8 C 22 10, 19 14, 19 20 L 5 20" fill="url(#wonBagGrad)" />
                <path d="M10 6 L8 3 H 16 L 14 6" fill="#854d0e" />
                <text x="12" y="16.5" fontFamily="'Noto Sans KR', sans-serif" fontSize="9" textAnchor="middle" fill="#854d0e" fontWeight="bold">₩</text>
            </g>
        </svg>
    );


    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-customer-pop-in"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white/95 rounded-2xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 w-full max-w-lg m-4"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                <h2 className="text-center text-3xl sm:text-4xl font-bold text-amber-800 mb-6">게임 방법</h2>
                <div className="space-y-4">
                    <TutorialStep 
                        step={1} 
                        icon={<div className="w-full h-full text-slate-500 animate-pulse"><BungeoppangIcon /></div>}
                        text="빈 붕어빵 틀을 클릭하세요."
                    />
                     <TutorialStep 
                        step={2} 
                        icon={<div className="flex items-center -space-x-3"><RedBeanIcon /><ChouxCreamIcon /></div>}
                        text="원하는 속을 선택하면 바로 굽기가 시작돼요."
                    />
                     <TutorialStep 
                        step={3} 
                        icon={<div className="w-full h-full text-amber-800 animate-icon-bob"><BungeoppangIcon /></div>}
                        text="노릇노릇 익으면 클릭! 타지 않게 조심하세요."
                    />
                     <TutorialStep 
                        step={4} 
                        icon={<div className="text-3xl animate-icon-wiggle">👨‍👩‍👧‍👦</div>}
                        text="손님 주문에 맞춰 만들면 자동으로 판매됩니다."
                    />
                     <TutorialStep 
                        step={5} 
                        icon={<div className="w-full h-full animate-icon-pop"><WonBagIcon /></div>}
                        text="목표 수익을 달성하고 최고의 가게를 만드세요!"
                    />
                </div>
                 <div className="mt-8 text-center">
                    <button 
                        onClick={handleClose}
                        className="px-8 py-3 text-xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TutorialModal;