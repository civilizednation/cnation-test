import React, { useState, useCallback, useRef, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import { FillingType } from '../types';
import { ICONS, FILLING_DETAILS } from '../constants';

// As per documentation, assuming process.env.API_KEY is available.
const API_KEY = process.env.API_KEY;

const LOADING_MESSAGES = [
    "AI가 레시피를 구상 중입니다...",
    "최고의 각도를 찾고 있어요...",
    "찰칵! 사진을 찍고 있어요...",
    "맛있게 보정하는 중...",
];

interface VideoGeneratorModalProps {
    onClose: () => void;
    onImageGenerated: (blob: Blob) => void;
}

const VideoGeneratorModal: React.FC<VideoGeneratorModalProps> = ({ onClose, onImageGenerated: onImageGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [selectedFilling, setSelectedFilling] = useState<FillingType>(FillingType.RED_BEAN);
    const [isLoading, setIsLoading] = useState(false);
    const [loadingMessage, setLoadingMessage] = useState('');
    const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
    const [error, setError] = useState<React.ReactNode | null>(null);
    
    const messageIntervalRef = useRef<number | null>(null);
    const BungeoppangIcon = ICONS.BUNGEOPPANG;

    useEffect(() => {
        const fillingName = FILLING_DETAILS[selectedFilling].label;
        const newPrompt = `바삭하고 황금빛 껍질을 가진, 맛있고 따끈한 생선 모양 빵(붕어빵)이 ${fillingName} 속으로 가득 찬 모습. 시네마틱, 맛있는 음식 사진 스타일.`;
        setPrompt(newPrompt);
    }, [selectedFilling]);

    // Clean up object URL to prevent memory leaks
    useEffect(() => {
        return () => {
            if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
                URL.revokeObjectURL(generatedImageUrl);
            }
        };
    }, [generatedImageUrl]);

    const handleClose = () => {
        if (isLoading) return;
        if (messageIntervalRef.current) {
            window.clearInterval(messageIntervalRef.current);
        }
        onClose();
    };

    const handleGenerateImage = useCallback(async () => {
        if (!API_KEY) {
            setError(
                <span>
                    AI 기능을 사용하려면 API 키가 필요합니다. 앱 환경에 API 키를 설정해주세요.
                    <br />
                    <a 
                        href="https://aistudio.google.com/app/apikey" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="underline text-blue-600 hover:text-blue-800"
                    >
                        Google AI Studio에서 API 키 발급받기
                    </a>
                </span>
            );
            return;
        }
        if (!prompt.trim()) {
            setError('이미지를 만들기 위한 설명(프롬프트)을 입력해주세요.');
            return;
        }

        setIsLoading(true);
        setError(null);
        if (generatedImageUrl && generatedImageUrl.startsWith('blob:')) {
            URL.revokeObjectURL(generatedImageUrl);
        }
        setGeneratedImageUrl(null);
        
        setLoadingMessage(LOADING_MESSAGES[0]);
        let messageIndex = 1;
        messageIntervalRef.current = window.setInterval(() => {
            setLoadingMessage(LOADING_MESSAGES[messageIndex % LOADING_MESSAGES.length]);
            messageIndex++;
        }, 3000);

        try {
            const ai = new GoogleGenAI({ apiKey: API_KEY });
            
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: prompt.trim(),
                config: {
                  numberOfImages: 1,
                  outputMimeType: 'image/jpeg',
                  aspectRatio: '1:1',
                },
            });

            if (messageIntervalRef.current) {
                window.clearInterval(messageIntervalRef.current);
                messageIntervalRef.current = null;
            }

            const base64ImageBytes: string | undefined = response.generatedImages?.[0]?.image.imageBytes;
            if (base64ImageBytes) {
                const byteCharacters = atob(base64ImageBytes);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const imageBlob = new Blob([byteArray], {type: 'image/jpeg'});
                
                onImageGenerated(imageBlob);
            } else {
                throw new Error('AI 모델에서 이미지를 생성하지 못했습니다.');
            }

        } catch (err) {
            console.error(err);
            let errorMessage: React.ReactNode = '알 수 없는 오류가 발생했습니다.';
            if (err instanceof Error) {
                if (err.message.includes('RESOURCE_EXHAUSTED') || err.message.includes('quota exceeded')) {
                    errorMessage = 'AI 이미지 생성 무료 이용 한도를 초과했습니다. Google AI Studio에서 API 키 사용량을 확인하거나 결제 정보를 설정해주세요.';
                } else if (err.message.toLowerCase().includes('api key not valid') || err.message.toLowerCase().includes('invalid api key')) {
                    errorMessage = (
                        <span>
                            API 키가 유효하지 않습니다. 올바른 API 키인지 확인해주세요.
                            <br />
                            <a 
                                href="https://aistudio.google.com/app/apikey" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="underline text-blue-600 hover:text-blue-800"
                            >
                                Google AI Studio에서 API 키 확인하기
                            </a>
                        </span>
                    );
                } else {
                    errorMessage = err.message;
                }
            }
            setError(<div><strong>오류:</strong> {errorMessage}</div>);
            if (messageIntervalRef.current) {
                window.clearInterval(messageIntervalRef.current);
                messageIntervalRef.current = null;
            }
        } finally {
            setIsLoading(false);
        }

    }, [prompt, generatedImageUrl, onImageGenerated]);

    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-customer-pop-in"
            onClick={handleClose}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white/95 rounded-2xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 w-full max-w-2xl m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-center text-3xl sm:text-4xl font-bold text-amber-800 mb-4">나만의 붕어빵 홍보 이미지</h2>
                <div className="text-center text-stone-600 mb-6">
                    <p>AI를 이용해 가게를 홍보할 멋진 이미지를 만들어보세요!</p>
                    <p>(이미지 생성은 보통 10초 내로 완료됩니다)</p>
                </div>

                <div className="flex flex-col gap-4 flex-grow">
                    <div>
                        <h3 className="text-lg font-semibold text-amber-900 mb-2 text-center">1. 속 재료 선택</h3>
                        <div className="grid grid-cols-4 sm:grid-cols-7 gap-2">
                            {Object.values(FillingType).map((filling) => {
                                // FIX: Cast the string value from Object.values to the specific enum type for safe access.
                                const fillingType = filling as FillingType;
                                const details = FILLING_DETAILS[fillingType];
                                const isSelected = selectedFilling === fillingType;
                                const FillingIcon = ICONS[fillingType];
                                return (
                                    <button
                                        key={fillingType}
                                        onClick={() => setSelectedFilling(fillingType)}
                                        className={`flex flex-col items-center justify-center p-2 rounded-lg border-2 transition-all h-20 ${
                                            isSelected
                                                ? 'bg-amber-200 border-amber-500 scale-105 shadow'
                                                : 'bg-white border-amber-300 hover:bg-amber-50'
                                        }`}
                                        disabled={isLoading}
                                    >
                                        <div className="w-8 h-8"><FillingIcon /></div>
                                        <span className={`text-xs font-semibold mt-1 ${details.textColor}`}>{details.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    
                    <div>
                        <h3 className="text-lg font-semibold text-amber-900 mb-2 text-center">2. 이미지 설명 수정 (선택 사항)</h3>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="어떤 이미지를 만들고 싶으신가요?"
                            className="w-full p-3 border-2 border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition resize-none"
                            rows={3}
                            disabled={isLoading}
                        />
                    </div>

                    <div className="h-64 bg-slate-200 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-400 overflow-hidden">
                        {error ? (
                             <div className="text-center text-red-600 font-semibold p-4">{error}</div>
                        ) : generatedImageUrl ? (
                            <img src={generatedImageUrl} alt="생성된 AI 이미지" className="w-full h-full object-contain" />
                        ) : (
                            <p className="text-slate-500">이곳에 결과물이 표시됩니다.</p>
                        )}
                    </div>
                </div>

                <div className="mt-8 flex justify-between items-center">
                    <button
                        onClick={handleClose}
                        disabled={isLoading}
                        className="px-6 py-3 text-lg font-bold text-slate-700 bg-slate-200 rounded-full shadow-md hover:bg-slate-300 disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-wait transition-all"
                    >
                        닫기
                    </button>
                     <button
                        onClick={handleGenerateImage}
                        disabled={isLoading}
                        className="px-8 py-3 text-xl font-bold text-white bg-blue-500 rounded-full shadow-lg hover:bg-blue-600 transform hover:scale-105 disabled:bg-blue-300 disabled:scale-100 disabled:cursor-wait transition-all"
                    >
                        만들기!
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="absolute inset-0 z-51 bg-black/70 backdrop-blur-sm flex flex-col items-center justify-center text-white animate-customer-pop-in">
                    <div className="w-32 h-32 animate-gentle-bob">
                        <BungeoppangIcon crustLevel={1} decorationLevel={2} />
                    </div>
                    <h2 className="text-4xl font-bold mt-4" style={{textShadow: '2px 2px #000'}}>생성 중...</h2>
                    <p className="mt-2 text-xl text-amber-200">{loadingMessage}</p>
                </div>
            )}
        </div>
    );
};

export default VideoGeneratorModal;
