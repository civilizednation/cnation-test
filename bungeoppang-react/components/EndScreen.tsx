import React from 'react';
import { FillingType } from '../types';
import { ICONS, FILLING_DETAILS } from '../constants';

interface EndScreenProps {
    result: {
        revenue: number;
        goal: number;
        success: boolean;
        bunsSold: number;
        avgPatience: number;
        mostPopularFilling: FillingType | null;
        fillingsSold: Partial<Record<FillingType, number>>;
    };
    totalRevenue: number;
    onProceed: () => void;
    day: number;
}

const EndScreen: React.FC<EndScreenProps> = ({ result, totalRevenue, onProceed, day }) => {
    const { revenue, goal, success, bunsSold, avgPatience, mostPopularFilling, fillingsSold } = result;

    const handleProceed = () => {
        onProceed();
    }
    
    const getSatisfactionEmoji = (patience: number) => {
        if (patience > 80) return '😍';
        if (patience > 50) return '😊';
        if (patience > 25) return '😐';
        return '😠';
    };

    const getPatienceColor = (patience: number) => {
        if (patience > 50) return 'text-green-500';
        if (patience > 25) return 'text-yellow-500';
        return 'text-red-500';
    };

    const sortedFillings = Object.entries(fillingsSold)
        .filter((entry): entry is [FillingType, number] => typeof entry[1] === 'number' && entry[1] > 0)
        .sort(([, a], [, b]) => b - a);

    const maxSold = sortedFillings.length > 0 ? sortedFillings[0][1] : 0;

    const BungeoppangIcon = ICONS.BUNGEOPPANG;

    return (
        <div className="flex flex-col items-center justify-center h-full text-center bg-amber-50 rounded-lg p-4 sm:p-8 overflow-y-auto">
            <h1 className="text-5xl sm:text-7xl font-bold mb-4" style={{ textShadow: '2px 2px #d97706' }}>
                {success ? '성공!' : '아쉬워요!'}
            </h1>
            <p className={`text-2xl sm:text-3xl mb-8 ${success ? 'text-green-600' : 'text-red-600'}`}>
                {success ? '오늘 장사도 무사히 마쳤습니다!' : '목표를 달성하지 못했어요.'}
            </p>
            
            <div className="bg-white/60 p-6 sm:p-8 rounded-lg shadow-inner text-lg sm:text-xl text-stone-700 mb-10 w-full max-w-2xl space-y-4">
                 <h2 className="text-2xl sm:text-3xl font-bold text-amber-800 text-center mb-4 border-b-2 border-amber-200 pb-2">
                    Day {day} 결과
                </h2>
                {/* Revenue section */}
                <div className="space-y-2">
                    <div className="flex justify-between">
                        <span>오늘의 목표:</span>
                        <span className="font-bold">₩{goal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>오늘의 수익:</span>
                        <span className={`font-bold ${success ? 'text-green-700' : 'text-red-700'}`}>₩{revenue.toLocaleString()}</span>
                    </div>
                    <hr className="my-2 border-stone-300"/>
                    <div className="flex justify-between">
                        <span>총 수익:</span>
                        <span className="font-bold text-amber-800">₩{totalRevenue.toLocaleString()}</span>
                    </div>
                </div>

                <hr className="my-4 border-amber-300 border-dashed" />

                {/* General Stats section */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
                    <div className="flex justify-between items-center">
                        <span>총 판매량:</span>
                        <div className="flex items-center gap-2 font-bold">
                            <div className="w-8 h-8 text-amber-700"><BungeoppangIcon crustLevel={0} decorationLevel={0} /></div>
                            <span>{bunsSold}개</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center">
                        <span>평균 손님 만족도:</span>
                        <div className="flex items-center gap-2 font-bold">
                            <span className={`text-2xl ${getPatienceColor(avgPatience)}`}>{getSatisfactionEmoji(avgPatience)}</span>
                            <span>{avgPatience}%</span>
                        </div>
                    </div>
                    <div className="flex justify-between items-center sm:col-span-2">
                        <span>오늘의 인기 메뉴:</span>
                        {mostPopularFilling ? (() => {
                            const PopularIcon = ICONS[mostPopularFilling];
                            return (
                                <div className="flex items-center gap-2 font-bold">
                                    <div className="w-8 h-8"><PopularIcon /></div>
                                    <span className={FILLING_DETAILS[mostPopularFilling].textColor}>{FILLING_DETAILS[mostPopularFilling].label}</span>
                                </div>
                            );
                        })() : (
                            <span className="font-bold text-stone-500">판매 기록 없음</span>
                        )}
                    </div>
                </div>

                <hr className="my-4 border-amber-300 border-dashed" />

                {/* Sales Chart section */}
                <div>
                    <h3 className="text-xl font-bold text-amber-800 mb-3 text-center">오늘의 판매 현황</h3>
                    {sortedFillings.length > 0 ? (
                        <div className="space-y-2 text-left">
                            {sortedFillings.map(([filling, count]) => {
                                const details = FILLING_DETAILS[filling as FillingType];
                                const barWidth = maxSold > 0 ? (count / maxSold) * 100 : 0;
                                const FillingIcon = ICONS[filling as FillingType];
                                return (
                                    <div key={filling} className="grid grid-cols-[2rem_5rem_1fr] items-center gap-3 text-base">
                                        <div className="w-8 h-8 flex items-center justify-center"><FillingIcon /></div>
                                        <div className={`font-semibold ${details.textColor}`}>{details.label}</div>
                                        <div className="flex-grow bg-amber-200 rounded-full h-6 flex items-center">
                                            <div 
                                                className="bg-amber-500 h-full rounded-full text-right pr-2 text-white font-bold text-sm flex items-center justify-end transition-all duration-500 ease-out"
                                                style={{ width: `${barWidth}%`, minWidth: '22px' }} // minWidth to ensure number is visible
                                            >
                                                <span>{count}</span>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    ) : (
                        <p className="text-center text-stone-500 py-2">판매된 붕어빵이 없습니다.</p>
                    )}
                </div>
            </div>

            <button
                onClick={handleProceed}
                className="px-8 py-3 text-2xl sm:px-12 sm:py-5 sm:text-3xl font-bold text-white bg-orange-500 rounded-full shadow-lg hover:bg-orange-600 transform hover:scale-105 transition-all duration-300 ease-in-out border-4 border-orange-600"
            >
                {success ? '보너스 미션 도전!' : '다시 도전!'}
            </button>
        </div>
    );
};

export default EndScreen;