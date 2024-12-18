'use client'

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export default function DeleteConfirmationModal({ isOpen, onClose, children }: ModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div 
                className="fixed inset-0 bg-black/70 backdrop-blur-sm"
                onClick={onClose}
            />
            
            {/* Modal Content */}
            <div className="relative z-50 bg-spotify-dark-elevated rounded-lg shadow-xl max-w-md w-full mx-4 animate-in fade-in slide-in-from-bottom-4 duration-300">
                {children}
            </div>
        </div>
    );
}