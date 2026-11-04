import React from 'react';
// FIX: Correctly import enums from the newly fixed types.ts
import { FillingType, UpgradeType } from './types';

// Base values, can be modified by upgrades
export const BASE_PRICE_PER_BUN = 500;

// Unchanged constants
export const BURN_TIME_MS = 3000;
export const CUSTOMER_SPAWN_MIN_MS = 5000;
export const CUSTOMER_SPAWN_MAX_MS = 12000;
export const MAX_CUSTOMERS = 4;
export const CUSTOMER_ICONS = ['👨', '👩', '👴', '👵', '👦', '👧', '👨‍🦱', '👩‍🦰', '👨‍🦳', '👩‍🦳', '👱‍♂️', '👱‍♀️', '👨‍⚕️', '👩‍🏫', '👨‍🎓', '👩‍🌾'];

// FIX: Add explicit types for upgrade configuration to aid TypeScript's type inference.
type UpgradeLevelInfo = { cost: number; value: number; bonus?: number };

interface UpgradeConfigInfo {
    name: string;
    levels: UpgradeLevelInfo[];
    description: (value: number) => string;
}

export const UPGRADE_CONFIG: Record<UpgradeType, UpgradeConfigInfo> = {
    [UpgradeType.MOLD_COUNT]: {
        name: '붕어빵틀 추가',
        levels: [
            { cost: 0, value: 6 },
            { cost: 10000, value: 8 },
            { cost: 30000, value: 9 },
            { cost: 70000, value: 12 },
        ],
        description: (value: number) => `틀 ${value}개`
    },
    [UpgradeType.COOK_SPEED]: {
        name: '굽기 속도 향상',
        levels: [
            { cost: 0, value: 3000 }, // 3s
            { cost: 7000, value: 2500 }, // 2.5s
            { cost: 20000, value: 2000 }, // 2s
            { cost: 50000, value: 1500 }, // 1.5s
        ],
        description: (value: number) => `굽는 시간 ${value / 1000}초`
    },
    [UpgradeType.PATIENCE_TIME]: {
        name: '손님 인내심 증가',
        levels: [
            { cost: 0, value: 45000 }, // 45s
            { cost: 8000, value: 55000 }, // 55s
            { cost: 20000, value: 65000 }, // 65s
            { cost: 45000, value: 75000 }, // 75s
        ],
        description: (value: number) => `대기 시간 ${value / 1000}초`
    },
    [UpgradeType.BUNGEOPPANG_CRUST]: {
        name: '빵 껍질 업그레이드',
        levels: [
            { cost: 0, value: 0, bonus: 0 },
            { cost: 8000, value: 1, bonus: 10 },
            { cost: 20000, value: 2, bonus: 25 },
            { cost: 45000, value: 3, bonus: 50 },
            { cost: 80000, value: 4, bonus: 100 },
        ],
        description: (value: number) => {
            if (value === 1) return '황금빛 껍질 (+₩10)';
            if (value === 2) return '눈부신 껍질 (+₩25)';
            if (value === 3) return '차콜 껍질 (+₩50)';
            if (value === 4) return '무지개 껍질 (+₩100)';
            return '기본 껍질';
        }
    },
    [UpgradeType.BUNGEOPPANG_DECORATION]: {
        name: '토핑 추가',
        levels: [
            { cost: 0, value: 0 }, // None
            { cost: 12000, value: 1 }, // Sugar Powder
            { cost: 30000, value: 2 }, // Chocolate Drizzle
            { cost: 60000, value: 3 }, // Golden Crown
            { cost: 100000, value: 4 }, // Sprinkles
            { cost: 150000, value: 5 }, // Cherry Topping
        ],
        description: (value: number) => {
            if (value === 1) return '슈가 파우더';
            if (value === 2) return '초콜릿 드리즐';
            if (value === 3) return '황금 왕관';
            if (value === 4) return '알록달록 스프링클';
            if (value === 5) return '상큼 체리 토핑';
            return '토핑 없음';
        }
    },
    [UpgradeType.FASTER_SERVING]: {
        name: '서빙 속도 향상',
        levels: [
            { cost: 0, value: 1000 }, // 1s
            { cost: 6000, value: 750 }, // 0.75s
            { cost: 16000, value: 500 }, // 0.5s
            { cost: 35000, value: 250 }, // 0.25s
            { cost: 70000, value: 100 }, // 0.1s
        ],
        description: (value: number) => `서빙 시간 ${value / 1000}초`
    },
    [UpgradeType.AUTO_BAKE]: {
        name: '자동 굽기',
        levels: [
            { cost: 0, value: 0 }, // Off
            { cost: 75000, value: 1 }, // On
        ],
        description: (value: number) => value === 1 ? '활성화 (팥 붕어빵)' : '비활성화'
    },
    [UpgradeType.AUTO_SERVE]: {
        name: '자동 서빙 로봇',
        levels: [
            { cost: 0, value: 6000 }, // Base speed: 6s
            { cost: 25000, value: 3000 }, // 3s
            { cost: 80000, value: 1500 }, // 1.5s
            { cost: 200000, value: 750 }, // 0.75s
        ],
        description: (value: number) => value === 6000 ? '기본' : `서빙 확인 간격 ${value / 1000}초`
    }
};

export const LEVEL_CONFIG = [
    { day: 1, goal: 5000 },
    { day: 2, goal: 7500 },
    { day: 3, goal: 10000 },
];

export const FILLING_DETAILS: Record<FillingType, { textColor: string; label: string }> = {
    [FillingType.RED_BEAN]: { textColor: 'text-red-800', label: '팥' },
    [FillingType.CHOUX_CREAM]: { textColor: 'text-yellow-700', label: '슈크림' },
    [FillingType.PIZZA]: { textColor: 'text-red-700', label: '피자' },
    [FillingType.SWEET_POTATO]: { textColor: 'text-purple-800', label: '고구마' },
    [FillingType.CHOCOLATE]: { textColor: 'text-stone-700', label: '초콜릿' },
    [FillingType.STRAWBERRY]: { textColor: 'text-pink-700', label: '딸기' },
    [FillingType.BLUEBERRY]: { textColor: 'text-blue-700', label: '블루베리' },
    [FillingType.HONEY]: { textColor: 'text-amber-600', label: '벌꿀' },
};

// --- SVG Icon Components (unmemoized) ---
const RedBeanSVG = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Red Bean</title>
        <defs>
            <radialGradient id="redBeanGrad" cx="0.5" cy="0.5" r="0.7">
                <stop offset="0%" stopColor="#8c3b3b" />
                <stop offset="100%" stopColor="#5a1d1d" />
            </radialGradient>
            <filter id="bean-shadow">
                <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.2"/>
            </filter>
        </defs>
        <g filter="url(#bean-shadow)">
            <ellipse cx="15" cy="16" rx="5" ry="3.5" transform="rotate(-30 15 16)" fill="url(#redBeanGrad)" />
            <ellipse cx="9" cy="15" rx="5" ry="3.5" transform="rotate(20 9 15)" fill="url(#redBeanGrad)" />
            <ellipse cx="12" cy="8" rx="5" ry="3.5" transform="rotate(5 12 8)" fill="url(#redBeanGrad)" />
            
            <path d="M14 15.5 Q 15 15.2, 16 15.5" stroke="white" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.3" transform="rotate(-30 15 16)" />
            <path d="M8 14.5 Q 9 14.2, 10 14.5" stroke="white" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.3" transform="rotate(20 9 15)" />
            <path d="M11 7.5 Q 12 7.2, 13 7.5" stroke="white" strokeWidth="0.5" fill="none" strokeLinecap="round" opacity="0.3" transform="rotate(5 12 8)" />
        </g>
    </svg>
);

const ChouxCreamSVG = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Choux Cream</title>
        <defs>
            <radialGradient id="chouxCreamGradRealistic" cx="0.5" cy="0.5" r="0.8">
                <stop offset="0%" stopColor="#fef3c7" />
                <stop offset="80%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#facc15" />
            </radialGradient>
            <filter id="cream-shadow-realistic">
                <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodColor="#a16207" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#cream-shadow-realistic)">
            {/* Main Swirl Body */}
            <path 
                d="M12 22 C 4 22 3 15 9.5 13 C 10.5 12.5 10 10 12 7 C 14 10 13.5 12.5 14.5 13 C 21 15 20 22 12 22 Z"
                fill="url(#chouxCreamGradRealistic)"
            />
            {/* Highlight */}
            <path 
                d="M9 14 C 11 12, 13 12, 15 14 C 14 15, 12 15.5, 10 15 C 9 14.5, 9 14, 9 14 Z"
                fill="white"
                opacity="0.3"
                transform="rotate(-10 12 15)"
            />
            <path
                d="M11 9 C 12 8, 13 8, 13.5 9 C 13 9.5, 12 9.8, 11.5 9.5 Z"
                fill="white"
                opacity="0.25"
            />
             {/* Ridges for piped effect */}
            <path
                d="M5.5 19 C 7 16, 8.5 14, 9.5 13"
                stroke="#fef9c3" strokeWidth="1" fill="none" opacity="0.7" strokeLinecap="round"
            />
            <path
                d="M18.5 19 C 17 16, 15.5 14, 14.5 13"
                stroke="#fef9c3" strokeWidth="1" fill="none" opacity="0.7" strokeLinecap="round"
            />
             <path
                d="M12 22 C 12 18, 11 14, 10 13.5"
                stroke="#fef9c3" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round"
            />
             <path
                d="M12 22 C 12 18, 13 14, 14 13.5"
                stroke="#fef9c3" strokeWidth="1" fill="none" opacity="0.5" strokeLinecap="round"
            />
        </g>
    </svg>
);

const PizzaSVG = () => (
     <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Pizza</title>
        <defs>
            <linearGradient id="pizzaCrustGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fbbf24" />
                <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
        </defs>
         <g transform="rotate(15 12 12)">
            <path d="M12 2 L4 18 C 4 20, 6 22, 12 22 C 18 22, 20 20, 20 18 L12 2 Z" fill="#facc15" />
            <path d="M12 2 L5 17.5 C 5 19, 6.5 21, 12 21 C 17.5 21, 19 19, 19 17.5 L12 2 Z" fill="#ef4444" />
            <path d="M12 3 L6.5 17 C 7 18, 12 19, 17.5 17 L12 3 Z" fill="#fef08a" opacity="0.8" />
            <path d="M4.5,18 C 4.5 20, 6.5 22, 12 22 C 17.5 22, 19.5 20, 19.5 18 L18 18 C 18 19, 16 20, 12 20 C 8 20, 6 19, 6 18 Z" fill="url(#pizzaCrustGrad)" />
            <circle cx="10" cy="10" r="2" fill="#be123c" />
            <circle cx="15" cy="14" r="1.8" fill="#be123c" />
            <circle cx="13" cy="7" r="1.5" fill="#be123c" />
        </g>
    </svg>
);

const SweetPotatoSVG = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Sweet Potato</title>
        <defs>
            <linearGradient id="sweetPotatoSkinGrad2" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#581c87" />
                <stop offset="100%" stopColor="#3b0764" />
            </linearGradient>
            <radialGradient id="sweetPotatoFleshGrad" cx="0.5" cy="0.5" r="0.6">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="100%" stopColor="#f97316" />
            </radialGradient>
             <filter id="potato-shadow-cut">
                <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#potato-shadow-cut)">
            {/* Skin */}
            <path d="M 4 15 C 2 12, 6 6, 12 6 C 18 6, 22 10, 20 16 C 18 22, 8 20, 4 15 Z" fill="url(#sweetPotatoSkinGrad2)" />
            {/* Flesh */}
            <path d="M 5 14.5 C 3.5 12, 7 7.5, 12.5 7 C 17.5 6.5, 20.5 10, 19.5 15 C 18.5 19.5, 9 19, 5 14.5 Z" fill="url(#sweetPotatoFleshGrad)" />
        </g>
    </svg>
);

const ChocolateSVG = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Chocolate</title>
        <defs>
            <linearGradient id="chocolateGradBar" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#78350f"/>
                <stop offset="100%" stopColor="#451a03"/>
            </linearGradient>
             <filter id="chocolate-shadow-bar">
                <feDropShadow dx="1" dy="1" stdDeviation="1" floodColor="#000" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#chocolate-shadow-bar)" transform="rotate(-20 12 12)">
            <rect x="5" y="5" width="14" height="14" rx="2" fill="url(#chocolateGradBar)" />
            <line x1="9.5" y1="5" x2="9.5" y2="19" stroke="#451a03" strokeWidth="1.5" />
            <line x1="14.5" y1="5" x2="14.5" y2="19" stroke="#451a03" strokeWidth="1.5" />
            <line x1="5" y1="9.5" x2="19" y2="9.5" stroke="#451a03" strokeWidth="1.5" />
            <line x1="5" y1="14.5" x2="19" y2="14.5" stroke="#451a03" strokeWidth="1.5" />
        </g>
    </svg>
);

const StrawberrySVG = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Strawberry</title>
        <defs>
            <radialGradient id="strawberryGradRealistic" cx="0.5" cy="0.4" r="0.9">
                <stop offset="0%" stopColor="#f87171" />
                <stop offset="60%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#b91c1c" />
            </radialGradient>
            <filter id="strawberry-shadow-realistic">
                <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.2"/>
            </filter>
        </defs>
        <g filter="url(#strawberry-shadow-realistic)">
            {/* Strawberry Body */}
            <path d="M12 5 C 6 5, 4 12, 11.5 21 C 12 21.8, 12 21.8, 12.5 21 C 20 12, 18 5, 12 5 Z" fill="url(#strawberryGradRealistic)" />

            {/* Highlight */}
            <path d="M10 8 C 12 7, 14 7.5, 15 9.5 C 13.5 10, 11.5 9.5, 10 8 Z" fill="white" opacity="0.25" />

            {/* Seeds */}
            <g fill="#fef08a" opacity="0.9">
                <ellipse cx="9.5" cy="11" rx="0.5" ry="0.7" transform="rotate(-20 9.5 11)" />
                <ellipse cx="14.5" cy="11" rx="0.5" ry="0.7" transform="rotate(20 14.5 11)" />
                <ellipse cx="12" cy="13.5" rx="0.5" ry="0.7" />
                <ellipse cx="8" cy="14.5" rx="0.5" ry="0.7" transform="rotate(-35 8 14.5)" />
                <ellipse cx="16" cy="14.5" rx="0.5" ry="0.7" transform="rotate(35 16 14.5)" />
                <ellipse cx="10" cy="17" rx="0.5" ry="0.7" transform="rotate(-10 10 17)" />
                <ellipse cx="14" cy="17" rx="0.5" ry="0.7" transform="rotate(10 14 17)" />
                <ellipse cx="12" cy="9" rx="0.5" ry="0.7" />
            </g>

            {/* Calyx (Leaves) */}
            <g fill="#22c55e" stroke="#16a34a" strokeWidth="0.5" strokeLinejoin="round">
                <path d="M12 5.5 L 7 8 Q 12 6, 17 8 Z" />
                <path d="M12 5.5 L 9 9 Q 12 7, 15 9 Z" />
            </g>
            
            {/* Stem */}
            <path d="M12 3 L 12 5.5" stroke="#15803d" strokeWidth="1.5" strokeLinecap="round" />
        </g>
    </svg>
);

const BlueberrySVG = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Blueberry</title>
        <defs>
            <radialGradient id="realisticBlueberryGrad" cx="0.3" cy="0.3" r="0.7">
                <stop offset="0%" stopColor="#a78bfa" />
                <stop offset="100%" stopColor="#5b21b6" />
            </radialGradient>
            <radialGradient id="realisticBlueberryHighlight" cx="0.3" cy="0.3" r="0.9">
                <stop offset="0%" stopColor="white" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </radialGradient>
            <symbol id="blueberry-crown" viewBox="-5 -5 10 10">
                <path d="M -2.5 0 L 0 -2.5 L 2.5 0 L 0 2.5 Z" fill="none" stroke="#312e81" strokeWidth="1.2" strokeLinejoin="round" />
                <path d="M -1.5 -1.5 L 1.5 1.5 M -1.5 1.5 L 1.5 -1.5" stroke="#312e81" strokeWidth="1" />
            </symbol>
        </defs>
        <g transform="translate(15.5, 15.5)">
          <circle r="6" fill="url(#realisticBlueberryGrad)" />
          <circle r="6" fill="url(#realisticBlueberryHighlight)" />
          <use href="#blueberry-crown" width="10" height="10" transform="scale(0.35)" />
        </g>
        <g transform="translate(8, 16)">
          <circle r="5" fill="url(#realisticBlueberryGrad)" />
          <circle r="5" fill="url(#realisticBlueberryHighlight)" />
          <use href="#blueberry-crown" width="10" height="10" transform="scale(0.3)" />
        </g>
        <g transform="translate(12, 7.5)">
          <circle r="5.5" fill="url(#realisticBlueberryGrad)" />
          <circle r="5.5" fill="url(#realisticBlueberryHighlight)" />
          <use href="#blueberry-crown" width="10" height="10" transform="scale(0.33)" />
        </g>
    </svg>
);

const HoneySVG = () => (
    <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <title>Honey</title>
        <defs>
            <linearGradient id="honeyGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde047" />
                <stop offset="100%" stopColor="#f59e0b" />
            </linearGradient>
            <filter id="honey-shadow">
                <feDropShadow dx="0.5" dy="1" stdDeviation="0.5" floodColor="#a16207" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#honey-shadow)">
            {/* Hexagons for honeycomb */}
            <path d="M12 4 L16 6 L16 10 L12 12 L8 10 L8 6 Z" fill="url(#honeyGrad)" stroke="#ca8a04" strokeWidth="0.7"/>
            <path d="M8 6 L12 8 L12 12 L8 14 L4 12 L4 8 Z" fill="url(#honeyGrad)" stroke="#ca8a04" strokeWidth="0.7"/>
            <path d="M16 6 L20 8 L20 12 L16 14 L12 12 L12 8 Z" fill="url(#honeyGrad)" stroke="#ca8a04" strokeWidth="0.7"/>
            <path d="M12 12 L16 14 L16 18 L12 20 L8 18 L8 14 Z" fill="url(#honeyGrad)" stroke="#ca8a04" strokeWidth="0.7"/>

            {/* Dripping Honey */}
            <path d="M5 13 C 5 16, 4 16, 4.5 18 C 5 20, 6 20, 6 18 C 5.5 16, 6 16, 5 13 Z" fill="#facc15" />
            <path d="M19 13 C 19 16, 18 16, 18.5 18 C 19 20, 20 20, 20 18 C 19.5 16, 20 16, 19 13 Z" fill="#facc15" transform="rotate(10 19 13)" />
        </g>
    </svg>
);

const BungeoppangSVG: React.FC<{crustLevel?: number; decorationLevel?: number;}> = ({ crustLevel = 0, decorationLevel = 0 }) => {
    const bodyGradId = `bungeo-body-grad-${crustLevel}`;
    const finGradId = `bungeo-fin-grad-${crustLevel}`;
    const shadowFilterId = `bungeo-shadow-3d`;

    // Stroke colors based on crust level
    const mainStrokeColor = crustLevel === 3 ? "#111827" : "#854d0e";
    const detailStrokeColor = crustLevel === 3 ? "#000" : "#92400e";

    return (
        <svg viewBox="0 0 64 42" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" overflow="visible">
            <defs>
                {/* Level 0 Gradients */}
                <radialGradient id="bungeo-body-grad-0" cx="50%" cy="50%" r="70%" fx="70%" fy="40%">
                    <stop offset="0%" stopColor="#fef3c7" /><stop offset="60%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#92400e" />
                </radialGradient>
                <linearGradient id="bungeo-fin-grad-0" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" /><stop offset="100%" stopColor="#b45309" />
                </linearGradient>
                {/* Level 1 Gradients */}
                <radialGradient id="bungeo-body-grad-1" cx="50%" cy="50%" r="70%" fx="70%" fy="40%">
                    <stop offset="0%" stopColor="#fffbeb" /><stop offset="60%" stopColor="#facc15" /><stop offset="100%" stopColor="#b45309" />
                </radialGradient>
                <linearGradient id="bungeo-fin-grad-1" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#facc15" /><stop offset="100%" stopColor="#d97706" />
                </linearGradient>
                {/* Level 2 Gradients */}
                <radialGradient id="bungeo-body-grad-2" cx="50%" cy="50%" r="70%" fx="70%" fy="40%">
                    <stop offset="0%" stopColor="#fefce8" /><stop offset="60%" stopColor="#fde047" /><stop offset="100%" stopColor="#ca8a04" />
                </radialGradient>
                <linearGradient id="bungeo-fin-grad-2" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fde047" /><stop offset="100%" stopColor="#eab308" />
                </linearGradient>
                {/* Level 3 Gradients (Charcoal) */}
                <radialGradient id="bungeo-body-grad-3" cx="50%" cy="50%" r="70%" fx="70%" fy="40%">
                    <stop offset="0%" stopColor="#4b5563" /><stop offset="60%" stopColor="#1f2937" /><stop offset="100%" stopColor="#111827" />
                </radialGradient>
                <linearGradient id="bungeo-fin-grad-3" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#374151" /><stop offset="100%" stopColor="#111827" />
                </linearGradient>
                {/* Level 4 Gradients (Rainbow) */}
                <radialGradient id="bungeo-body-grad-4" cx="50%" cy="50%" r="70%" fx="70%" fy="40%">
                    <stop offset="0%" stopColor="#f87171" /><stop offset="20%" stopColor="#fbbf24" /><stop offset="40%" stopColor="#a3e635" /><stop offset="60%" stopColor="#38bdf8" /><stop offset="80%" stopColor="#a78bfa" /><stop offset="100%" stopColor="#f472b6" />
                    <animateTransform attributeName="gradientTransform" type="rotate" values="0 0.5 0.5; 360 0.5 0.5" dur="4s" repeatCount="indefinite" />
                </radialGradient>
                <linearGradient id="bungeo-fin-grad-4" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#f87171" /><stop offset="50%" stopColor="#a3e635" /><stop offset="100%" stopColor="#a78bfa" />
                </linearGradient>

                {/* Decoration Gradients */}
                <radialGradient id="cherryGrad" cx="0.3" cy="0.3" r="0.8">
                    <stop offset="0%" stopColor="#ef4444" />
                    <stop offset="100%" stopColor="#b91c1c" />
                </radialGradient>

                {/* New Shadow filter for 3D effect */}
                <filter id={shadowFilterId} x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="1" dy="1.5" stdDeviation="1" floodColor="#000" floodOpacity="0.2"/>
                </filter>
                
                {crustLevel === 2 && (
                    <filter id="bungeo-glow" x="-50%" y="-50%" width="200%" height="200%">
                        <feGaussianBlur stdDeviation="1.5" result="coloredBlur" />
                        <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                        </feMerge>
                    </filter>
                )}
                 {/* New Embers glow for charcoal */}
                <filter id="embers-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.5" result="blur" />
                    <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="crown-glow" x="-50%" y="-50%" width="200%" height="200%">
                    <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.5" floodColor="#000" floodOpacity="0.5" />
                </filter>
            </defs>
            <g>
                <animateTransform
                    attributeName="transform"
                    type="rotate"
                    values="-4 32 21; 4 32 21; -4 32 21"
                    dur="5s"
                    repeatCount="indefinite"
                    keyTimes="0; 0.5; 1"
                    calcMode="spline"
                    keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
                />
                <g transform="scale(-1, 1) translate(-64, 0)" filter={`url(#${shadowFilterId}) ${crustLevel === 2 ? "url(#bungeo-glow)" : ""}`}>
                    <path
                        d="M51.8,38.5C46,41.9,38.3,41.5,32,38C20.6,31.6,14.4,16.1,22.3,6.7C28.8,-1.1,41.6,-2.1,51.3,4.5 C59.2,9.7,63.6,18.9,60.6,27.5C62.9,23.3,65.2,16.5,59.3,12l-5.6,3.3c-2.4,1.4-2.4,5.2,0,6.6l5.6,3.3 C59.8,29.3,57,35.5,51.8,38.5z"
                        fill={`url(#${bodyGradId})`}
                        stroke={mainStrokeColor}
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                     {/* Volumetric Highlight */}
                    <path
                        d="M25,12 C35,8, 45,9, 52,16 C 50,15, 40,13, 30,14 Z"
                        fill="white"
                        opacity={crustLevel === 3 ? '0.05' : '0.15'}
                        style={{ filter: 'blur(1px)' }}
                        transform="rotate(-2)"
                    />
                    {/* Volumetric Shading */}
                    <path
                        d="M30,36 C40,39, 48,39, 53,35 C 50,36, 40,37, 33,34 Z"
                        fill="#000"
                        opacity={crustLevel === 3 ? '0.2' : '0.1'}
                        style={{ filter: 'blur(2px)' }}
                    />

                    <path 
                        d="M44,4.8 Q 48,3 51.3,4.5 L 48,9 L 44,8 Z"
                        fill={`url(#${finGradId})`}
                        stroke={mainStrokeColor}
                        strokeWidth="1"
                        strokeLinejoin="round"
                    />
                    <g stroke={detailStrokeColor} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7">
                        <path d="M37,14 C38.5,19.5,38.2,25.5,36.5,30" />
                        <path d="M42,15 C43.5,20,43.2,25,41.5,29" />
                    </g>
                     <g stroke={detailStrokeColor} strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7">
                        <path d="M53.5,17.5 L58,20" />
                        <path d="M53.5,22.5 L58,25" />
                    </g>
                    <circle cx="28.5" cy="18" r="1.8" fill={crustLevel === 3 ? '#ff4500' : '#451a03'} />
                    <circle cx="28.9" cy="17.6" r="0.7" fill="white" opacity="0.8"/>
                    <path d="M26,23 C27.5,24.5,30,24.2,31,23.2" stroke={mainStrokeColor} strokeWidth="1.2" fill="none" strokeLinecap="round" />
                </g>
                
                 {/* NEW VISUAL EFFECTS BASED ON CRUST LEVEL */}
                <g transform="scale(-1, 1) translate(-64, 0)" style={{ pointerEvents: 'none' }}>
                    {/* Level 1: Golden Crust - subtle sparkles */}
                    {crustLevel === 1 && (
                        <g fill="#fffbeb" opacity="0.8">
                            <path d="M38 18 l 1 2 l 2 -2 l -2 -2 z">
                                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="0.5s" />
                            </path>
                            <path d="M47 25 l 1.5 2.5 l 2.5 -2.5 l -2.5 -2.5 z" transform="rotate(20 47 25)">
                                <animate attributeName="opacity" values="0;1;0" dur="2s" repeatCount="indefinite" begin="1.2s" />
                            </path>
                            <circle cx="53" cy="16" r="1">
                                <animate attributeName="opacity" values="0;0.8;0" dur="2s" repeatCount="indefinite" begin="0.2s" />
                            </circle>
                        </g>
                    )}
                    
                    {/* Level 2: Dazzling Crust - star glint */}
                    {crustLevel === 2 && (
                        <g>
                           <path d="M35 15 l 2 2 l 8 -8 l -2 -2 z" fill="white" opacity="0.7">
                               <animateTransform attributeName="transform" type="rotate" from="0 40 10" to="20 40 10" dur="8s" repeatCount="indefinite" />
                               <animate attributeName="opacity" values="0;0.7;0" dur="3s" repeatCount="indefinite" begin="0s" />
                           </path>
                           <path d="M35 15 l 2 2 l 8 -8 l -2 -2 z" fill="white" opacity="0.7" transform="rotate(90 40 10)">
                               <animateTransform attributeName="transform" type="rotate" from="90 40 10" to="110 40 10" dur="8s" repeatCount="indefinite" />
                               <animate attributeName="opacity" values="0;0.7;0" dur="3s" repeatCount="indefinite" begin="0s" />
                           </path>
                           <path d="M50 28 l 1 1 l 4 -4 l -1 -1 z" fill="white" opacity="0.5">
                               <animate attributeName="opacity" values="0;0.5;0" dur="3s" repeatCount="indefinite" begin="1.5s" />
                           </path>
                           <path d="M50 28 l 1 1 l 4 -4 l -1 -1 z" fill="white" opacity="0.5" transform="rotate(90 52 26)">
                               <animate attributeName="opacity" values="0;0.5;0" dur="3s" repeatCount="indefinite" begin="1.5s" />
                           </path>
                        </g>
                    )}

                    {/* Level 3: Charcoal Crust - glowing embers */}
                    {crustLevel === 3 && (
                        <g filter="url(#embers-glow)">
                            <path d="M37,14 C38.5,19.5,38.2,25.5,36.5,30" stroke="#ff4500" strokeWidth="0.8" fill="none" opacity="0.7">
                                <animate attributeName="opacity" values="0.4;0.8;0.4" dur="2.5s" repeatCount="indefinite" />
                            </path>
                            <path d="M48,16 C49,20,48,23,47,26" stroke="#ff8c00" strokeWidth="0.6" fill="none" opacity="0.6">
                                <animate attributeName="opacity" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" begin="0.8s" />
                            </path>
                             <path d="M26,23 C27.5,24.5,30,24.2,31,23.2" stroke="#ff4500" strokeWidth="0.7" fill="none" strokeLinecap="round" opacity="0.5">
                                 <animate attributeName="opacity" values="0.2;0.5;0.2" dur="3s" repeatCount="indefinite" />
                             </path>
                        </g>
                    )}

                    {/* Level 4: Rainbow Crust - tiny star sparkles */}
                    {crustLevel === 4 && (
                        <g opacity="0.9">
                            <path d="M36 24 l 0.5 1 l 1 -1 l -1 -1 z" fill="#f472b6">
                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.1s" />
                            </path>
                            <path d="M45 18 l 0.5 1 l 1 -1 l -1 -1 z" fill="#60a5fa">
                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="0.6s" />
                            </path>
                            <path d="M51 26 l 0.5 1 l 1 -1 l -1 -1 z" fill="#4ade80">
                                <animate attributeName="opacity" values="0;1;0" dur="1.5s" repeatCount="indefinite" begin="1.1s" />
                            </path>
                        </g>
                    )}
                </g>
                
                {decorationLevel === 1 && (
                    <g transform="scale(-1, 1) translate(-64, 0)" fill="white" opacity="0.9">
                        <circle cx="35" cy="22" r="0.7" />
                        <circle cx="40" cy="28" r="0.9" />
                        <circle cx="45" cy="20" r="0.6" />
                        <circle cx="48" cy="25" r="0.8" />
                        <circle cx="38" cy="16" r="0.5" />
                        <circle cx="52" cy="18" r="0.7" />
                        <circle cx="33" cy="30" r="0.6" />
                        <circle cx="43" cy="32" r="0.8" />
                    </g>
                )}
                {decorationLevel === 2 && (
                     <g transform="scale(-1, 1) translate(-64, 0)" stroke="#451a03" strokeWidth="1.2" fill="none" strokeLinecap="round" opacity="0.8">
                        <path d="M33,34 C 38,28 40,29 45,24 S 50,28 55,22" />
                        <path d="M36,37 C 41,31 43,32 48,27 S 53,31 58,25" />
                     </g>
                )}
                {decorationLevel === 3 && (
                     <g transform="scale(-1, 1) translate(-64, 0)" filter="url(#crown-glow)">
                        <path d="M26,12 L28,8 L30,10 L32,8 L34,12 L26,12 Z" fill="#fde047" stroke="#ca8a04" strokeWidth="0.7" />
                     </g>
                )}
                {decorationLevel === 4 && (
                    <g transform="scale(-1, 1) translate(-64, 0)" opacity="0.9">
                        <rect x="35" y="22" width="4" height="1.5" rx="1" fill="#f472b6" transform="rotate(20 35 22)" />
                        <rect x="40" y="28" width="4" height="1.5" rx="1" fill="#60a5fa" transform="rotate(-10 40 28)" />
                        <rect x="45" y="20" width="4" height="1.5" rx="1" fill="#facc15" transform="rotate(45 45 20)" />
                        <rect x="48" y="25" width="4" height="1.5" rx="1" fill="#4ade80" transform="rotate(-30 48 25)" />
                        <rect x="38" y="16" width="4" height="1.5" rx="1" fill="#f472b6" transform="rotate(10 38 16)" />
                        <rect x="52" y="18" width="4" height="1.5" rx="1" fill="#60a5fa" transform="rotate(50 52 18)" />
                        <rect x="33" y="30" width="4" height="1.5" rx="1" fill="#facc15" transform="rotate(0 33 30)" />
                        <rect x="43" y="32" width="4" height="1.5" rx="1" fill="#4ade80" transform="rotate(-20 43 32)" />
                        <rect x="50" y="30" width="4" height="1.5" rx="1" fill="#f472b6" transform="rotate(30 50 30)" />
                    </g>
                )}
                {decorationLevel === 5 && (
                    <g transform="scale(-1, 1) translate(-64, 0)">
                        <g transform="translate(45, 12)" filter="url(#crown-glow)">
                             <path d="M-3,1 Q-5,-4 0,-4" stroke="#166534" strokeWidth="1.5" fill="none" strokeLinecap="round" />
                             <circle cx="0" cy="0" r="4" fill="url(#cherryGrad)" stroke="#7f1d1d" strokeWidth="0.5" />
                             <circle cx="-1.5" cy="-1.5" r="1" fill="white" opacity="0.5" />
                        </g>
                    </g>
                )}
            </g>
        </svg>
    );
};

const GoldenBungeoppangSVG = () => (
    <svg viewBox="0 0 64 42" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" overflow="visible">
        <defs>
            <radialGradient id="golden-bungeo-body-grad" cx="50%" cy="50%" r="70%" fx="70%" fy="40%">
                <stop offset="0%" stopColor="#fffbeb" /><stop offset="60%" stopColor="#fde047" /><stop offset="100%" stopColor="#ca8a04" />
            </radialGradient>
            <linearGradient id="golden-bungeo-fin-grad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#fde047" /><stop offset="100%" stopColor="#eab308" />
            </linearGradient>
            <filter id="golden-bungeo-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                <feMerge>
                    <feMergeNode in="coloredBlur" />
                    <feMergeNode in="SourceGraphic" />
                </feMerge>
            </filter>
        </defs>
        <g>
            <animateTransform
                attributeName="transform"
                type="rotate"
                values="-4 32 21; 4 32 21; -4 32 21"
                dur="5s"
                repeatCount="indefinite"
                keyTimes="0; 0.5; 1"
                calcMode="spline"
                keySplines="0.42 0 0.58 1; 0.42 0 0.58 1"
            />
            <g transform="scale(-1, 1) translate(-64, 0)" filter="url(#golden-bungeo-glow)">
                <path
                    d="M51.8,38.5C46,41.9,38.3,41.5,32,38C20.6,31.6,14.4,16.1,22.3,6.7C28.8,-1.1,41.6,-2.1,51.3,4.5 C59.2,9.7,63.6,18.9,60.6,27.5C62.9,23.3,65.2,16.5,59.3,12l-5.6,3.3c-2.4,1.4-2.4,5.2,0,6.6l5.6,3.3 C59.8,29.3,57,35.5,51.8,38.5z"
                    fill="url(#golden-bungeo-body-grad)"
                    stroke="#a16207"
                    strokeWidth="1.5"
                    strokeLinejoin="round"
                />
                <path 
                    d="M44,4.8 Q 48,3 51.3,4.5 L 48,9 L 44,8 Z"
                    fill="url(#golden-bungeo-fin-grad)"
                    stroke="#a16207"
                    strokeWidth="1"
                    strokeLinejoin="round"
                />
                <g stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7">
                    <path d="M37,14 C38.5,19.5,38.2,25.5,36.5,30" />
                    <path d="M42,15 C43.5,20,43.2,25,41.5,29" />
                </g>
                 <g stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.7">
                    <path d="M53.5,17.5 L58,20" />
                    <path d="M53.5,22.5 L58,25" />
                </g>
                <circle cx="28.5" cy="18" r="1.8" fill="#451a03" />
                <circle cx="28.9" cy="17.6" r="0.7" fill="white" opacity="0.8"/>
                <path d="M26,23 C27.5,24.5,30,24.2,31,23.2" stroke="#a16207" strokeWidth="1.2" fill="none" strokeLinecap="round" />
            </g>
        </g>
    </svg>
);

const BasketSVG = () => (
    <svg viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="basketGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a16207"/>
                <stop offset="100%" stopColor="#854d0e"/>
            </linearGradient>
            <filter id="basket-shadow">
                <feDropShadow dx="2" dy="2" stdDeviation="2" floodColor="#000" floodOpacity="0.3"/>
            </filter>
        </defs>
        <g filter="url(#basket-shadow)">
            <path d="M 5 15 C 5 5, 15 5, 20 15 L 30 45 C 30 50, 70 50, 70 45 L 80 15 C 85 5, 95 5, 95 15" fill="url(#basketGrad)" stroke="#5f370e" strokeWidth="3" />
            <path d="M 20 15 C 30 25, 70 25, 80 15" fill="none" stroke="#5f370e" strokeWidth="3" />
            <rect x="2" y="12" width="96" height="8" rx="4" fill="#854d0e" stroke="#5f370e" strokeWidth="2" />
        </g>
    </svg>
);

const PlateSVG = () => (
    <svg viewBox="0 0 100 20" xmlns="http://www.w3.org/2000/svg">
        <defs>
            <linearGradient id="plateGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#e5e7eb" />
                <stop offset="100%" stopColor="#d1d5db" />
            </linearGradient>
            <filter id="plate-shadow">
                <feDropShadow dx="1" dy="2" stdDeviation="1.5" floodColor="#000" floodOpacity="0.2"/>
            </filter>
        </defs>
        <g filter="url(#plate-shadow)">
            <ellipse cx="50" cy="10" rx="48" ry="8" fill="url(#plateGrad)" stroke="#9ca3af" strokeWidth="1.5" />
            <ellipse cx="50" cy="8" rx="45" ry="6" fill="#f9fafb" />
        </g>
    </svg>
);


// FIX: Convert SVG definitions to memoized components to improve rendering performance.
// This changes the type from React.ReactElement to React.FC.
export const ICONS: { [key in FillingType]: React.FC } & { BUNGEOPPANG: React.FC<{crustLevel?: number; decorationLevel?: number;}>; GOLDEN_BUNGEOPPANG: React.FC; BASKET: React.FC; PLATE: React.FC; } = {
    [FillingType.RED_BEAN]: React.memo(RedBeanSVG),
    [FillingType.CHOUX_CREAM]: React.memo(ChouxCreamSVG),
    [FillingType.PIZZA]: React.memo(PizzaSVG),
    [FillingType.SWEET_POTATO]: React.memo(SweetPotatoSVG),
    [FillingType.CHOCOLATE]: React.memo(ChocolateSVG),
    [FillingType.STRAWBERRY]: React.memo(StrawberrySVG),
    [FillingType.BLUEBERRY]: React.memo(BlueberrySVG),
    [FillingType.HONEY]: React.memo(HoneySVG),
    BUNGEOPPANG: React.memo(BungeoppangSVG),
    GOLDEN_BUNGEOPPANG: React.memo(GoldenBungeoppangSVG),
    BASKET: React.memo(BasketSVG),
    PLATE: React.memo(PlateSVG),
};
