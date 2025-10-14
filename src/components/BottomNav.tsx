import { HomeIcon } from './HomeIcon';
import { DrawIcon } from './DrawIcon';
import { MeaningsIcon } from './MeaningsIcon';
import { HistoryIcon } from './HistoryIcon';
import { ProfileIcon } from './ProfileIcon';

interface BottomNavProps {
    currentTab: string;
    onTabChange: (tab: string) => void;
}

export function BottomNav({ currentTab, onTabChange }: BottomNavProps) {
    const tabs = [
        { id: 'home', label: 'Home', icon: HomeIcon },
        { id: 'new', label: 'Draw', icon: DrawIcon },
        { id: 'meanings', label: 'Meanings', icon: MeaningsIcon },
        { id: 'history', label: 'History', icon: HistoryIcon },
        { id: 'profile', label: 'Profile', icon: ProfileIcon }
    ];

    return (
        <nav className="fixed bottom-0 left-0 right-0 bg-black/30 backdrop-blur-md border-t border-white/10">
            <div className="flex justify-around items-center py-2">
                {tabs.map((tab) => {
                    const IconComponent = tab.icon;
                    const isActive = currentTab === tab.id;
                    
                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className={`flex flex-col items-center py-2 px-3 transition-colors ${
                                isActive 
                                    ? 'text-[#ffd700]' 
                                    : 'text-white/60 hover:text-white/80'
                            }`}
                        >
                            <IconComponent className={tab.id === 'new' ? 'w-10 h-10' : 'w-8 h-8'} />
                            <span className="text-xs mt-1 font-medium">{tab.label}</span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
