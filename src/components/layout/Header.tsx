import { Activity, Users, LayoutDashboard, Plus, LogOut, User, Settings, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { DivisionType } from '@/hooks/useProfile';

interface HeaderProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onAddActivity: () => void;
  isManager?: boolean;
  userDivision?: DivisionType;
  companyLogo?: string | null;
  companyName?: string;
  onOpenCompanySettings?: () => void;
}

export function Header({ 
  activeTab, 
  onTabChange, 
  onAddActivity, 
  isManager, 
  userDivision,
  companyLogo,
  companyName = 'SalesTrack',
  onOpenCompanySettings
}: HeaderProps) {
  const { signOut, user } = useAuth();
  
  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'activities', label: 'Aktivitas', icon: Activity },
    { id: 'persons', label: 'Tim', icon: Users },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              {companyLogo ? (
                <img 
                  src={companyLogo} 
                  alt={companyName}
                  className="h-10 w-10 rounded-lg object-contain bg-background border border-border"
                />
              ) : (
                <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-primary">
                  <Activity className="h-5 w-5 text-primary-foreground" />
                </div>
              )}
              <div>
                <h1 className="text-lg font-bold text-foreground">{companyName}</h1>
                <p className="text-xs text-muted-foreground">Monitoring Activity</p>
              </div>
              {isManager && onOpenCompanySettings && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onOpenCompanySettings}
                  title="Pengaturan Perusahaan"
                  className="ml-1"
                >
                  <Settings className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <nav className="hidden md:flex items-center gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => onTabChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {userDivision && (
              <Badge variant="outline" className="hidden sm:flex items-center gap-1">
                <User className="h-3 w-3" />
                {userDivision === 'manager' ? 'Manager' : userDivision === 'sales' ? 'Sales' : 'Presales'}
                {isManager && <span className="text-xs">(Admin)</span>}
              </Badge>
            )}
            <Button onClick={onAddActivity} className="gap-2">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Tambah Aktivitas</span>
            </Button>
            
            {user && (
              <Button variant="ghost" size="icon" onClick={signOut} title="Keluar">
                <LogOut className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Navigation */}
        <nav className="flex md:hidden items-center gap-1 pb-3 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
}
