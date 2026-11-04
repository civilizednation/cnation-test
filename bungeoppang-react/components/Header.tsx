import React from 'react';
import { DailySpecial } from '../types';

interface HeaderProps {
    day: number;
    timeLeft: number;
    revenue: number;
    goal: number;
    dailySpecial: DailySpecial | null;
}

const Header: React.FC<HeaderProps> = ({ day, timeLeft, revenue, goal, dailySpecial }) => {
    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    const progressPercentage = Math.min((revenue / goal) * 100, 100);

    return (
        <div className="bg-amber-800 text-white rounded-lg shadow-md p-2 sm:p-4 flex flex-col sm:flex-row justify-between items-center text-lg sm:text-xl md:text-2xl font-bold border-4 border-amber-900 gap-2 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-4">
                <span>Day {day}</span>
                <span>남은 시간: {formatTime(timeLeft)}</span>
            </div>
            {dailySpecial && (
                <div className="order-last sm:order-none text-base px-3 py-1 bg-yellow-300 text-yellow-900 rounded-full animate-pulse shadow-md whitespace-nowrap">
                    🌟 {dailySpecial.description}
                </div>
            )}
            <div className="flex items-center space-x-2 sm:space-x-4 w-full sm:w-auto sm:min-w-[250px] md:min-w-[300px]">
                <span className="flex-shrink-0">수익: ₩{revenue.toLocaleString()}</span>
                <div className="w-full bg-amber-600 rounded-full h-5 sm:h-6 border-2 border-amber-900">
                    <div
                        className="bg-green-400 h-full rounded-full transition-all duration-500"
                        style={{ width: `${progressPercentage}%` }}
                    ></div>
                </div>
            </div>
        </div>
    );
};

export default React.memo(Header);