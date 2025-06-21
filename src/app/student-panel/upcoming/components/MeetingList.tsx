import { Meeting } from '@/lib/types';
import { MeetingCard } from './MeetingCard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from 'lucide-react';

interface MeetingListProps {
  meetings: Meeting[];
  favoriteMeetings: string[];
  onJoin: (meetingId: string) => void;
  onFavorite: (meetingId: string) => void;
}

export function MeetingList({ meetings, favoriteMeetings, onJoin, onFavorite }: MeetingListProps) {
  if (meetings.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg text-muted-foreground mb-4">Henüz bir görüşme bulunmuyor.</p>
          <Button variant="default" onClick={() => window.location.href = '/student-panel/sessions'}>
            Görüşme Bul
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {meetings.map((meeting) => (
        <MeetingCard
          key={meeting.id}
          meeting={meeting}
          onJoin={onJoin}
          onFavorite={onFavorite}
          isFavorite={favoriteMeetings.includes(meeting.id)}
        />
      ))}
    </div>
  );
} 