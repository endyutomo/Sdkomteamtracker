import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ActivityList } from '@/components/activities/ActivityList';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { ActivityReport } from '@/components/activities/ActivityReport';
import { PersonList } from '@/components/persons/PersonList';
import { PersonForm } from '@/components/persons/PersonForm';
import { ProfileForm } from '@/components/profile/ProfileForm';
import { TeamMemberList } from '@/components/profile/TeamMemberList';
import { CompanySettingsDialog } from '@/components/company/CompanySettingsDialog';
import { SettingsDialog } from '@/components/settings/SettingsDialog';
import { Button } from '@/components/ui/button';
import { Plus, Search, Loader2, MapPin, Phone, Mail, Users, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/useAuth';
import { usePersons } from '@/hooks/usePersons';
import { useActivities } from '@/hooks/useActivities';
import { useProfile } from '@/hooks/useProfile';
import { useCompanySettings } from '@/hooks/useCompanySettings';
import { DailyActivity, Person } from '@/types';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { persons, loading: personsLoading, addPerson, updatePerson, deletePerson } = usePersons();
  const { activities, loading: activitiesLoading, addActivity, updateActivity, deleteActivity, refetch: refetchActivities } = useActivities();
  const { profile, allProfiles, loading: profileLoading, isManager, createProfile, updateProfile, deleteProfile, refetchAll } = useProfile();
  const { settings: companySettings, updateSettings, uploadLogo, loading: companyLoading } = useCompanySettings();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editActivity, setEditActivity] = useState<DailyActivity | null>(null);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  // Refresh handler
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await Promise.all([
        refetchActivities(),
        refetchAll()
      ]);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Activity handlers
  const handleAddActivity = async (activity: Omit<DailyActivity, 'id' | 'createdAt'>) => {
    if (editActivity) {
      await updateActivity(editActivity.id, activity);
      setEditActivity(null);
    } else {
      await addActivity(activity);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    await deleteActivity(id);
  };

  const handleEditActivity = (activity: DailyActivity) => {
    setEditActivity(activity);
    setShowActivityForm(true);
  };

  // Person handlers
  const handleAddPerson = async (person: Omit<Person, 'id' | 'createdAt'>) => {
    if (editPerson) {
      await updatePerson(editPerson.id, person);
      setEditPerson(null);
    } else {
      await addPerson(person);
    }
  };

  const handleDeletePerson = async (id: string) => {
    await deletePerson(id);
  };

  const handleEditPerson = (person: Person) => {
    setEditPerson(person);
    setShowPersonForm(true);
  };

  // Filter activities by search, activity type, and user division
  const filteredActivities = activities.filter(a => {
    const matchesSearch = a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.notes.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = activityTypeFilter === 'all' || a.activityType === activityTypeFilter;
    
    // Manager can see all, sales can see their own + presales (read-only), presales see only their own
    if (isManager) return matchesSearch && matchesType;
    if (profile?.division === 'sales') return matchesSearch && matchesType; // Sales can see all (presales via RLS)
    if (profile?.division === 'presales') return matchesSearch && matchesType && a.category === 'presales';
    return matchesSearch && matchesType;
  });

  // Filter persons by search
  const filteredPersons = persons.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Show profile form if user hasn't completed their profile
  if (!profile) {
    return (
      <div className="min-h-screen bg-background">
        <ProfileForm
          open={true}
          onSubmit={createProfile}
          isNewUser={true}
        />
      </div>
    );
  }

  const isLoading = personsLoading || activitiesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddActivity={() => {
          setEditActivity(null);
          setShowActivityForm(true);
        }}
        isManager={isManager}
        userDivision={profile.division}
        companyLogo={companySettings?.logo_url}
        companyName={companySettings?.name || 'SalesTrack'}
        onOpenCompanySettings={() => setShowCompanySettings(true)}
        onOpenSettings={() => setShowSettings(true)}
      />

      <main className="container mx-auto px-4 py-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <Dashboard 
                activities={filteredActivities} 
                persons={persons} 
                allProfiles={allProfiles}
                onRefresh={handleRefresh}
                isRefreshing={isRefreshing}
              />
            )}

            {activeTab === 'activities' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Aktivitas Harian</h2>
                    <p className="text-muted-foreground">
                      {isManager ? 'Semua aktivitas tim' : `Aktivitas ${profile.division}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="relative flex-1 sm:w-48">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        placeholder="Cari aktivitas..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-9"
                      />
                    </div>
                    <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                      <SelectTrigger className="w-[140px]">
                        <SelectValue placeholder="Semua Tipe" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Semua Tipe
                          </div>
                        </SelectItem>
                        <SelectItem value="visit">
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            Kunjungan
                          </div>
                        </SelectItem>
                        <SelectItem value="call">
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            Telepon
                          </div>
                        </SelectItem>
                        <SelectItem value="email">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            Email
                          </div>
                        </SelectItem>
                        <SelectItem value="meeting">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" />
                            Meeting
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <Button onClick={() => {
                      setEditActivity(null);
                      setShowActivityForm(true);
                    }} className="gap-2 shrink-0">
                      <Plus className="h-4 w-4" />
                      <span className="hidden sm:inline">Tambah</span>
                    </Button>
                  </div>
                </div>
                
                <ActivityList 
                  activities={filteredActivities}
                  onDelete={handleDeleteActivity}
                  onEdit={handleEditActivity}
                />
              </div>
            )}

            {activeTab === 'report' && (
              <ActivityReport 
                activities={activities} 
                allProfiles={allProfiles} 
              />
            )}

            {activeTab === 'persons' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">Data Anggota Tim</h2>
                    <p className="text-muted-foreground">Semua anggota yang sudah terdaftar</p>
                  </div>
                  <div className="relative flex-1 sm:w-64 sm:flex-initial">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      placeholder="Cari anggota..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                
                <TeamMemberList 
                  profiles={allProfiles.filter(p => 
                    p.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )}
                  isManager={isManager}
                  onUpdate={updateProfile}
                  onDelete={deleteProfile}
                />
              </div>
            )}
          </>
        )}
      </main>

      <ActivityForm
        open={showActivityForm}
        onClose={() => {
          setShowActivityForm(false);
          setEditActivity(null);
        }}
        onSubmit={handleAddActivity}
        persons={persons}
        allProfiles={allProfiles}
        currentProfile={profile}
        editActivity={editActivity}
      />

      <PersonForm
        open={showPersonForm}
        onClose={() => {
          setShowPersonForm(false);
          setEditPerson(null);
        }}
        onSubmit={handleAddPerson}
        editPerson={editPerson}
      />

      <CompanySettingsDialog
        open={showCompanySettings}
        onClose={() => setShowCompanySettings(false)}
        settings={companySettings}
        onUpdate={updateSettings}
        uploadLogo={uploadLogo}
      />

      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
        profile={profile}
        onUpdateProfile={updateProfile}
      />
    </div>
  );
};

export default Index;
