import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, Plus, BookOpen, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { User } from '@supabase/supabase-js';

type JournalEntry = {
  id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
};

const Journal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [user, setUser] = useState<User | null>(null);
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<JournalEntry | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
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
      .from('journal_entries')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error loading entries:', error);
      return;
    }

    if (data) {
      setEntries(data);
    }
  };

  const openDialog = (entry?: JournalEntry) => {
    if (entry) {
      setCurrentEntry(entry);
      setTitle(entry.title);
      setContent(entry.content);
    } else {
      setCurrentEntry(null);
      setTitle('');
      setContent('');
    }
    setIsDialogOpen(true);
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setCurrentEntry(null);
    setTitle('');
    setContent('');
  };

  const saveEntry = async () => {
    if (!title.trim() || !content.trim() || !user) return;

    setLoading(true);
    try {
      if (currentEntry) {
        // Update existing entry
        const { error } = await supabase
          .from('journal_entries')
          .update({ title: title.trim(), content: content.trim() })
          .eq('id', currentEntry.id);

        if (error) throw error;

        toast({
          title: 'Entry updated!',
          description: 'Your journal entry has been saved.',
        });
      } else {
        // Create new entry
        const { error } = await supabase.from('journal_entries').insert({
          user_id: user.id,
          title: title.trim(),
          content: content.trim(),
        });

        if (error) throw error;

        toast({
          title: 'Entry created!',
          description: 'Your journal entry has been saved.',
        });
      }

      closeDialog();
      loadEntries(user.id);
    } catch (error) {
      console.error('Error saving entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to save entry. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string) => {
    if (!confirm('Are you sure you want to delete this entry?')) return;

    try {
      const { error } = await supabase
        .from('journal_entries')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Entry deleted',
        description: 'Your journal entry has been removed.',
      });

      if (user) {
        loadEntries(user.id);
      }
    } catch (error) {
      console.error('Error deleting entry:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete entry. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background">
      {/* Header */}
      <header className="border-b border-border/40 backdrop-blur-sm bg-card/30">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Journal</h1>
              <p className="text-sm text-muted-foreground">Your personal thoughts and reflections</p>
            </div>
          </div>
          <Button
            onClick={() => openDialog()}
            className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Entry
          </Button>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        {entries.length === 0 ? (
          <Card className="bg-card/80 backdrop-blur-sm border-border/50 animate-fade-in">
            <CardContent className="py-12 text-center">
              <BookOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h2 className="text-2xl font-bold mb-2 text-foreground">Start Your Journey</h2>
              <p className="text-muted-foreground mb-6">
                Create your first journal entry to begin reflecting on your thoughts and experiences.
              </p>
              <Button
                onClick={() => openDialog()}
                className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create First Entry
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {entries.map((entry, index) => (
              <Card
                key={entry.id}
                className="bg-card/80 backdrop-blur-sm border-border/50 hover:shadow-[var(--shadow-soft)] transition-all duration-300 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-xl mb-2">{entry.title}</CardTitle>
                      <CardDescription>
                        {format(new Date(entry.created_at), 'EEEE, MMMM d, yyyy • h:mm a')}
                      </CardDescription>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openDialog(entry)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteEntry(entry.id)}
                        className="hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground whitespace-pre-wrap line-clamp-3">
                    {entry.content}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {currentEntry ? 'Edit Entry' : 'New Journal Entry'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Input
                placeholder="Entry title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-semibold"
              />
            </div>
            <div>
              <Textarea
                placeholder="Write your thoughts here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] resize-none"
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={closeDialog}>
                Cancel
              </Button>
              <Button
                onClick={saveEntry}
                disabled={!title.trim() || !content.trim() || loading}
                className="bg-gradient-to-r from-primary to-primary-glow hover:opacity-90"
              >
                {loading ? 'Saving...' : currentEntry ? 'Update' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Journal;
