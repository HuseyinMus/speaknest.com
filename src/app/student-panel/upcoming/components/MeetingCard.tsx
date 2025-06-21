import { Meeting } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, Users, MapPin, Star } from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface MeetingCardProps {
  meeting: Meeting;
  onJoin: (meetingId: string) => void;
  onFavorite: (meetingId: string) => void;
  isFavorite?: boolean;
}

export function MeetingCard({ meeting, onJoin, onFavorite, isFavorite = false }: MeetingCardProps) {
  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="relative">
        <CardTitle className="text-xl">{meeting.title}</CardTitle>
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-4 right-4"
          onClick={() => onFavorite(meeting.id)}
        >
          <Star className={`h-5 w-5 ${isFavorite ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span>{format(meeting.date, 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.participants.length}/{meeting.maxParticipants} katılımcı</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span>{meeting.level} - {meeting.topic}</span>
          </div>
          <div className="flex items-center gap-2">
            <img
              src={meeting.host.photoURL}
              alt={meeting.host.name}
              className="h-6 w-6 rounded-full"
            />
            <span className="text-sm text-muted-foreground">{meeting.host.name}</span>
          </div>
          <Button className="w-full" onClick={() => onJoin(meeting.id)}>
            Katıl
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 