import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Smile, Meh, Frown, HeartCrack, Laugh } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { User } from '@supabase/supabase-js';

const moods = [
  { emoji: '😊', name: 'Happy', icon: Smile, color: 'from-green-400 to-emerald-500' },
  { emoji: '😄', name: 'Excited', icon: Laugh, color: 'from-yellow-400 to-amber-500' },
  { emoji: '😐', name: 'Neutral', icon: Meh, color: 'from-gray-400 to-slate-500' },
  { emoji: '😔', name: 'Sad', icon: Frown, color: 'from-blue-400 to-indigo-500' },
  { emoji: '😟', name: 'Anxious', icon: HeartCrack, color: 'from-purple-400 to-violet-500' },
];

type MoodEntry = {
  id: string;
  mood: string;
  note: string | null;
  created_at: string;
};

const MoodTracker = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [note, setNote] = useState('');
  const [entries, setEntries] = useState<MoodEntry[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/auth');
      } else {
        setUser(session.user);
        loadEntries(session.user.id);
      }
    });
  }, [navigate]);

  const loadEntries = async (userId: string) => {
    const { data, error } = await supabase
      .from('mood_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);

    if (error) {
      console.error('Error loading entries:', error);
      return;
    }

    if (data) {
      setEntries(data);
    }
  };

  const saveMood = async () => {
    if (!selectedMood || !user) return;

    setLoading(true);
    try {
      const { error } = await supabase.from('mood_entries').insert({
        user_id: user.id,
        mood: selectedMood,
        note: note.trim() || null,
      });

      if (error) throw error;

      toast({
        title: 'Mood logged!',
        description: 'Your mood has been saved.',
      });

      setSelectedMood('');
      setNote('');
      loadEntries(user.id);
    } catch (error) {
      console.error('Error saving mood:', error);
      toast({
        title: 'Error',
        description: 'Failed to save mood. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMoodColor = (moodName: string) => {
    const mood = moods.find(m => m.name === moodName);
    return mood?.color || 'from-gray-400 to-slate-500';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4 flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/dashboard')}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Mood Tracker</h1>
            <p className="text-sm text-muted-foreground">Track your emotional wellbeing</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Log Mood */}
        <Card className="mb-8 bg-card/80 backdrop-blur-sm border-border/50 animate-fade-in">
          <CardHeader>
            <CardTitle className="text-2xl">How are you feeling?</CardTitle>
            <CardDescription>Select your current mood and add a note</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-5 gap-4">
              {moods.map((mood) => (
                <button
                  key={mood.name}
                  onClick={() => setSelectedMood(mood.name)}
                  className={`aspect-square rounded-2xl transition-all duration-300 hover:scale-110 ${
                    selectedMood === mood.name
                      ? `bg-gradient-to-br ${mood.color} shadow-lg scale-105`
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  <div className="text-4xl">{mood.emoji}</div>
                  <div className={`text-xs font-medium mt-2 ${
                    selectedMood === mood.name ? 'text-white' : 'text-muted-foreground'
                  }`}>
                    {mood.name}
                  </div>
                </button>
              ))}
            </div>

            <Textarea
              placeholder="Add a note about how you're feeling... (optional)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="min-h-[100px]"
            />

            <Button
              onClick={saveMood}
              disabled={!selectedMood || loading}
              className="w-full bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
            >
              {loading ? 'Saving...' : 'Log Mood'}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Entries */}
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 animate-fade-up">
          <CardHeader>
            <CardTitle className="text-xl">Recent Entries</CardTitle>
            <CardDescription>Your mood history</CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                No mood entries yet. Start tracking your emotions!
              </p>
            ) : (
              <div className="space-y-4">
                {entries.map((entry) => {
                  const mood = moods.find(m => m.name === entry.mood);
                  return (
                    <div
                      key={entry.id}
                      className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${getMoodColor(entry.mood)} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-2xl">{mood?.emoji}</span>
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <span className="font-semibold text-foreground">{entry.mood}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(entry.created_at), 'MMM d, yyyy h:mm a')}
                          </span>
                        </div>
                        {entry.note && (
                          <p className="text-sm text-muted-foreground">{entry.note}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default MoodTracker;
