import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function AuditLog() {
  const [logs, setLogs] = useState<any[]>([]);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    const { data } = await supabase
      .from('audit_log')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100);
    setLogs(data || []);
  };

  const filteredLogs = logs.filter(log => 
    log.action_type.toLowerCase().includes(filter.toLowerCase()) ||
    log.table_name.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Log de Auditoria</h2>
        <p className="text-muted-foreground">Histórico de alterações no sistema</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label>Buscar</Label>
            <Input 
              placeholder="Filtrar por ação ou tabela" 
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Registros</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Usuário</TableHead>
                <TableHead>Ação</TableHead>
                <TableHead>Tabela</TableHead>
                <TableHead>ID do Registro</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id}>
                  <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                  <TableCell>{log.user_id}</TableCell>
                  <TableCell>{log.action_type}</TableCell>
                  <TableCell>{log.table_name}</TableCell>
                  <TableCell className="font-mono text-sm">{log.record_id}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}