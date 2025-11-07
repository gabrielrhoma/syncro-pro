import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, AlertTriangle, Info, Check } from "lucide-react";
import { toast } from "sonner";

export default function Alerts() {
  const [alerts, setAlerts] = useState<any[]>([]);

  useEffect(() => {
    loadAlerts();
  }, []);

  const loadAlerts = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('system_alerts')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    
    setAlerts(data || []);
  };

  const markAsRead = async (id: string) => {
    await supabase
      .from('system_alerts')
      .update({ is_read: true })
      .eq('id', id);
    
    loadAlerts();
    toast.success("Alerta marcado como lido");
  };

  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertCircle className="h-5 w-5 text-destructive" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      default: return <Info className="h-5 w-5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Central de Alertas</h2>
        <p className="text-muted-foreground">Notificações e alertas do sistema</p>
      </div>

      <div className="space-y-4">
        {alerts.map(alert => (
          <Card key={alert.id} className={!alert.is_read ? "border-primary" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {getIcon(alert.severity)}
                  <div>
                    <CardTitle className="text-lg">{alert.title}</CardTitle>
                    <Badge variant="outline" className="mt-1">
                      {alert.alert_type}
                    </Badge>
                  </div>
                </div>
                {!alert.is_read && (
                  <Button size="sm" onClick={() => markAsRead(alert.id)}>
                    <Check className="h-4 w-4 mr-1" />
                    Marcar como lido
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{alert.message}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {new Date(alert.created_at).toLocaleString()}
              </p>
            </CardContent>
          </Card>
        ))}

        {alerts.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-muted-foreground">
              Nenhum alerta no momento
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}