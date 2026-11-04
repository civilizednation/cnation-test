import React from 'react';

interface VideoPreviewModalProps {
    imageUrl: string;
    onConfirm: () => void;
    onCancel: () => void;
}

const VideoPreviewModal: React.FC<VideoPreviewModalProps> = ({ imageUrl, onConfirm, onCancel }) => {
    
    const handleConfirm = () => {
        onConfirm();
    }

    const handleCancel = () => {
        onCancel();
    }
    
    return (
        <div
            className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center backdrop-blur-sm animate-customer-pop-in"
            onClick={handleCancel}
            aria-modal="true"
            role="dialog"
        >
            <div
                className="bg-white/95 rounded-2xl shadow-2xl border-4 border-amber-300 p-6 sm:p-8 w-full max-w-2xl m-4 flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-center text-3xl sm:text-4xl font-bold text-amber-800 mb-6">이미지 미리보기</h2>
                
                <div className="w-full h-64 sm:h-96 bg-black rounded-lg flex items-center justify-center border-2 border-amber-300 overflow-hidden">
                    <img 
                        src={imageUrl} 
                        alt="AI 생성 홍보 이미지 미리보기"
                        className="max-h-full max-w-full rounded-lg"
                    />
                </div>
                
                <p className="text-center text-stone-600 my-4">이 이미지로 홍보 이미지를 설정하시겠습니까?</p>

                <div className="mt-4 flex justify-center items-center gap-6">
                    <button
                        onClick={handleCancel}
                        className="px-8 py-3 text-lg font-bold text-slate-700 bg-slate-200 rounded-full shadow-md hover:bg-slate-300 transition-all"
                    >
                        취소
                    </button>
                    <button
                        onClick={handleConfirm}
                        className="px-10 py-3 text-xl font-bold text-white bg-green-500 rounded-full shadow-lg hover:bg-green-600 transform hover:scale-105 transition-all"
                    >
                        확인
                    </button>
                </div>
            </div>
        </div>
    );
};

export default VideoPreviewModal;