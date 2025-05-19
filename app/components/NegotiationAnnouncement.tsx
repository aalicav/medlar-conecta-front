import { useState, useEffect } from 'react';
import { X, Info, Bell, TrendingUp, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { negotiationService } from '@/app/services/negotiationService';

interface Announcement {
  id: string;
  title: string;
  description: string;
  type: 'info' | 'feature' | 'update';
  date: string;
  dismissible: boolean;
}

export function NegotiationAnnouncement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentAnnouncementIndex, setCurrentAnnouncementIndex] = useState(0);
  const [dismissed, setDismissed] = useState<string[]>(() => {
    // Load dismissed announcements from localStorage
    const saved = localStorage.getItem('dismissedAnnouncements');
    return saved ? JSON.parse(saved) : [];
  });

  // Hard-coded announcements for now - would come from API in production
  const defaultAnnouncements: Announcement[] = [
    {
      id: 'negotiation-improvements-2023',
      title: 'Melhorias no fluxo de negociação',
      description: 'Aprimoramos o processo de negociação com aprovações internas antes do envio para a entidade. Agora as aprovações estão mais transparentes e organizadas.',
      type: 'update',
      date: '2023-11-05',
      dismissible: true
    }
  ];

  useEffect(() => {
    const fetchAnnouncements = async () => {
      setLoading(true);
      try {
        // In a real implementation, fetch from API
        // const response = await negotiationService.getAnnouncements();
        // const fetchedAnnouncements = response.data;
        
        // For now, use hard-coded announcements
        const fetchedAnnouncements = defaultAnnouncements;
        
        // Filter out dismissed announcements
        const filteredAnnouncements = fetchedAnnouncements.filter(
          announcement => !dismissed.includes(announcement.id)
        );
        
        setAnnouncements(filteredAnnouncements);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setAnnouncements([]);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, [dismissed]);

  const handleDismiss = (id: string) => {
    const newDismissed = [...dismissed, id];
    setDismissed(newDismissed);
    localStorage.setItem('dismissedAnnouncements', JSON.stringify(newDismissed));
  };

  const handleNext = () => {
    setCurrentAnnouncementIndex((prev) => 
      (prev + 1) % announcements.length
    );
  };

  const handlePrevious = () => {
    setCurrentAnnouncementIndex((prev) => 
      prev === 0 ? announcements.length - 1 : prev - 1
    );
  };

  if (loading || announcements.length === 0) {
    return null;
  }

  const currentAnnouncement = announcements[currentAnnouncementIndex];
  
  const getIconByType = (type: string) => {
    switch (type) {
      case 'feature':
        return <TrendingUp className="h-5 w-5 text-purple-500" />;
      case 'update':
        return <CheckCircle2 className="h-5 w-5 text-blue-500" />;
      default:
        return <Info className="h-5 w-5 text-blue-500" />;
    }
  };
  
  const getBadgeByType = (type: string) => {
    switch (type) {
      case 'feature':
        return <Badge variant="secondary">Nova Funcionalidade</Badge>;
      case 'update':
        return <Badge variant="outline">Atualização</Badge>;
      default:
        return <Badge>Informação</Badge>;
    }
  };

  return (
    <Card className="relative border-2 border-secondary/30 shadow-md mb-6 overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-primary" />
      
      {currentAnnouncement.dismissible && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute top-2 right-2" 
          onClick={() => handleDismiss(currentAnnouncement.id)}
        >
          <X className="h-4 w-4" />
        </Button>
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          {getIconByType(currentAnnouncement.type)}
          <CardTitle>{currentAnnouncement.title}</CardTitle>
        </div>
        <div className="flex justify-between items-center">
          <CardDescription>{new Date(currentAnnouncement.date).toLocaleDateString()}</CardDescription>
          {getBadgeByType(currentAnnouncement.type)}
        </div>
      </CardHeader>
      
      <CardContent>
        <p>{currentAnnouncement.description}</p>
      </CardContent>
      
      {announcements.length > 1 && (
        <CardFooter className="flex justify-between pt-2">
          <div className="text-sm text-muted-foreground">
            {currentAnnouncementIndex + 1} de {announcements.length}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrevious}>
              Anterior
            </Button>
            <Button variant="outline" size="sm" onClick={handleNext}>
              Próximo
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
} 