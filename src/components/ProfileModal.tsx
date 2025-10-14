interface ProfileModalProps {
    onClose: () => void;
    userProfile: any;
    onTabChange: (tab: string) => void;
}

export function ProfileModal({ onClose, userProfile, onTabChange }: ProfileModalProps) {
    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gradient-to-br from-[#2d1b4e] to-[#1a0f2e] rounded-2xl p-6 mx-4 max-w-md w-full">
                <h2 className="text-xl font-bold mb-4 text-center">Profile</h2>
                <p className="text-center text-white/80 mb-6">Coming soon...</p>
                <button 
                    onClick={onClose}
                    className="w-full bg-[#ffd700] text-black py-3 rounded-lg font-bold"
                >
                    Close
                </button>
            </div>
        </div>
    );
}
