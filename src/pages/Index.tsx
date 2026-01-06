import { useState } from 'react';
import { Header } from '@/components/layout/Header';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { ActivityList } from '@/components/activities/ActivityList';
import { ActivityForm } from '@/components/activities/ActivityForm';
import { PersonList } from '@/components/persons/PersonList';
import { PersonForm } from '@/components/persons/PersonForm';
import { Button } from '@/components/ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { DailyActivity, Person } from '@/types';
import { toast } from 'sonner';

const Index = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activities, setActivities] = useLocalStorage<DailyActivity[]>('sales-activities', []);
  const [persons, setPersons] = useLocalStorage<Person[]>('sales-persons', []);
  
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [showPersonForm, setShowPersonForm] = useState(false);
  const [editActivity, setEditActivity] = useState<DailyActivity | null>(null);
  const [editPerson, setEditPerson] = useState<Person | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Activity handlers
  const handleAddActivity = (activity: Omit<DailyActivity, 'id' | 'createdAt'>) => {
    if (editActivity) {
      setActivities(prev => prev.map(a => 
        a.id === editActivity.id 
          ? { ...a, ...activity }
          : a
      ));
      toast.success('Aktivitas berhasil diperbarui');
      setEditActivity(null);
    } else {
      const newActivity: DailyActivity = {
        ...activity,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      setActivities(prev => [...prev, newActivity]);
      toast.success('Aktivitas berhasil ditambahkan');
    }
  };

  const handleDeleteActivity = (id: string) => {
    setActivities(prev => prev.filter(a => a.id !== id));
    toast.success('Aktivitas berhasil dihapus');
  };

  const handleEditActivity = (activity: DailyActivity) => {
    setEditActivity(activity);
    setShowActivityForm(true);
  };

  // Person handlers
  const handleAddPerson = (person: Omit<Person, 'id' | 'createdAt'>) => {
    if (editPerson) {
      setPersons(prev => prev.map(p => 
        p.id === editPerson.id 
          ? { ...p, ...person }
          : p
      ));
      toast.success('Data person berhasil diperbarui');
      setEditPerson(null);
    } else {
      const newPerson: Person = {
        ...person,
        id: crypto.randomUUID(),
        createdAt: new Date(),
      };
      setPersons(prev => [...prev, newPerson]);
      toast.success('Person berhasil ditambahkan');
    }
  };

  const handleDeletePerson = (id: string) => {
    setPersons(prev => prev.filter(p => p.id !== id));
    toast.success('Person berhasil dihapus');
  };

  const handleEditPerson = (person: Person) => {
    setEditPerson(person);
    setShowPersonForm(true);
  };

  // Filter activities by search
  const filteredActivities = activities.filter(a => 
    a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.personName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.notes.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Filter persons by search
  const filteredPersons = persons.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddActivity={() => {
          setEditActivity(null);
          setShowActivityForm(true);
        }}
      />

      <main className="container mx-auto px-4 py-6">
        {activeTab === 'dashboard' && (
          <Dashboard activities={activities} persons={persons} />
        )}

        {activeTab === 'activities' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Aktivitas Harian</h2>
                <p className="text-muted-foreground">Kelola semua aktivitas sales team</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari aktivitas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
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

        {activeTab === 'persons' && (
          <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Data Person</h2>
                <p className="text-muted-foreground">Kelola data sales, presales, dan tim lainnya</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    placeholder="Cari person..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button onClick={() => {
                  setEditPerson(null);
                  setShowPersonForm(true);
                }} className="gap-2 shrink-0">
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Tambah</span>
                </Button>
              </div>
            </div>
            
            <PersonList 
              persons={filteredPersons}
              onDelete={handleDeletePerson}
              onEdit={handleEditPerson}
            />
          </div>
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
    </div>
  );
};

export default Index;
