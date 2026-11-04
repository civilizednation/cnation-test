

import React from 'react';
import { Customer, FillingType, Upgrades } from '../types';
import { ICONS } from '../constants';

interface CustomerQueueProps {
    customers: Customer[];
    upgrades: Upgrades;
}

const CustomerComponent: React.FC<{ customer: Customer; queueNumber: number; upgrades: Upgrades }> = React.memo(({ customer, queueNumber, upgrades }) => {
    const { order, patience, maxPatience, icon } = customer;
    const patiencePercentage = (patience / maxPatience) * 100;
    
    const getPatienceColor = () => {
        if (patiencePercentage > 50) return 'text-green-500';
        if (patiencePercentage > 25) return 'text-yellow-500';
        return 'text-red-500';
    };

    const radius = 14;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (patiencePercentage / 100) * circumference;

    const BungeoppangIcon = ICONS.BUNGEOPPANG;

    return (
        <div className="bg-white rounded-lg p-2 shadow-md border-2 border-amber-300 flex flex-col gap-2 relative animate-customer-pop-in">
            <div className="absolute -top-2 -left-2 w-6 h-6 bg-amber-800 text-white rounded-full flex items-center justify-center text-sm font-bold border-2 border-white">
                {queueNumber}
            </div>
            <div className="flex items-center gap-2">
                <div className="relative w-8 h-8 flex-shrink-0">
                    <svg className="w-full h-full" viewBox="0 0 32 32" role="img" aria-label={`Patience: ${Math.round(patiencePercentage)}%`}>
                        <circle
                            cx="16"
                            cy="16"
                            r={radius}
                            className="stroke-current text-gray-200"
                            strokeWidth="3"
                            fill="transparent"
                        />
                        <circle
                            cx="16"
                            cy="16"
                            r={radius}
                            className={`stroke-current ${getPatienceColor()}`}
                            strokeWidth="3"
                            fill="transparent"
                            strokeDasharray={circumference}
                            strokeDashoffset={offset}
                            transform="rotate(-90 16 16)"
                            strokeLinecap="round"
                            style={{ transition: 'stroke-dashoffset 0.05s linear, color 0.5s linear' }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center text-lg">
                        {icon}
                    </div>
                </div>
                <div className="text-lg font-bold text-amber-800">주문서</div>
            </div>
            <div className="flex flex-col gap-1">
                {Object.entries(order).map(([filling, quantity]) => {
                    if (!quantity || quantity === 0) return null;
                    const fillingType = filling as FillingType;
                    const FillingIcon = ICONS[fillingType];
                    return (
                        <div key={fillingType} className="flex items-center gap-2 text-base sm:text-lg">
                            <div className="w-7 h-7 text-amber-700"><BungeoppangIcon crustLevel={upgrades.BUNGEOPPANG_CRUST} decorationLevel={upgrades.BUNGEOPPANG_DECORATION} /></div>
                            <div className="w-7 h-7"><FillingIcon /></div>
                            <span>x {quantity}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
});

const CustomerQueue: React.FC<CustomerQueueProps> = React.memo(({ customers, upgrades }) => {
    return (
        <div className="bg-amber-200 rounded-lg p-2 sm:p-3 flex flex-col gap-2 sm:gap-3 h-full border-4 border-amber-400 overflow-y-auto">
            <h2 className="text-center text-3xl font-bold text-amber-800 sticky top-0 bg-amber-200 py-1 z-10">손님</h2>
            {customers.length === 0 && (
                <div className="flex-grow flex items-center justify-center">
                    <p className="text-amber-600 text-xl">손님을 기다리는 중...</p>
                </div>
            )}
            {customers.map((customer, index) => (
                <CustomerComponent key={customer.id} customer={customer} queueNumber={index + 1} upgrades={upgrades} />
            ))}
        </div>
    );
});

export default CustomerQueue;