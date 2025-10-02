import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Target } from 'lucide-react';

const Goals = () => {
  const navigate = useNavigate();

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
            <h1 className="text-2xl font-bold text-foreground">Goals & Challenges</h1>
            <p className="text-sm text-muted-foreground">Track your wellness objectives</p>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="bg-card/80 backdrop-blur-sm border-border/50 animate-fade-in">
          <CardContent className="py-12 text-center">
            <Target className="h-16 w-16 mx-auto mb-4 text-primary" />
            <h2 className="text-2xl font-bold mb-2 text-foreground">Coming Soon</h2>
            <p className="text-muted-foreground">
              Goal tracking and habit challenges will be available in the next update!
            </p>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Goals;
