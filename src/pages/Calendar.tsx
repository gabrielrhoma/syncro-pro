import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string | null;
}

export default function Calendar() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    event_type: "meeting",
    start_date: "",
    end_date: "",
    location: "",
  });

  useEffect(() => {
    loadEvents();
  }, []);

  const loadEvents = async () => {
    const { data } = await supabase
      .from('calendar_events')
      .select('*')
      .order('start_date', { ascending: true });

    setEvents(data || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { data: { user } } = await supabase.auth.getUser();

    const { error } = await supabase.from('calendar_events').insert({
      ...formData,
      created_by: user?.id,
    });

    if (error) {
      toast.error("Erro ao criar evento");
    } else {
      toast.success("Evento criado!");
      setOpen(false);
      loadEvents();
      resetForm();
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      description: "",
      event_type: "meeting",
      start_date: "",
      end_date: "",
      location: "",
    });
  };

  const eventsForSelectedDate = events.filter(event => {
    const eventDate = new Date(event.start_date);
    return eventDate.toDateString() === selectedDate.toDateString();
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Agenda</h2>
          <p className="text-muted-foreground">Gerencie seus compromissos</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Novo Evento
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Novo Evento</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="event_type">Tipo *</Label>
                <Select
                  value={formData.event_type}
                  onValueChange={(value) => setFormData({ ...formData, event_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="task">Tarefa</SelectItem>
                    <SelectItem value="reminder">Lembrete</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start_date">Data/Hora Início *</Label>
                  <Input
                    id="start_date"
                    type="datetime-local"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_date">Data/Hora Fim *</Label>
                  <Input
                    id="end_date"
                    type="datetime-local"
                    value={formData.end_date}
                    onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Local</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descrição</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">Criar</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Selecione uma Data
            </CardTitle>
          </CardHeader>
          <CardContent className="flex justify-center">
            <CalendarComponent
              mode="single"
              selected={selectedDate}
              onSelect={(date) => date && setSelectedDate(date)}
              locale={ptBR}
              className="rounded-md border"
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>
              Eventos em {format(selectedDate, "dd/MM/yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {eventsForSelectedDate.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhum evento neste dia</p>
              ) : (
                eventsForSelectedDate.map((event) => (
                  <div key={event.id} className="border-l-4 border-primary pl-4 py-2">
                    <h4 className="font-semibold">{event.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(event.start_date), "HH:mm", { locale: ptBR })} - {format(new Date(event.end_date), "HH:mm", { locale: ptBR })}
                    </p>
                    {event.location && (
                      <p className="text-sm text-muted-foreground">📍 {event.location}</p>
                    )}
                    {event.description && (
                      <p className="text-sm mt-1">{event.description}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}