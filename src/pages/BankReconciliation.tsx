import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload } from "lucide-react";

export default function BankReconciliation() {
  const [file, setFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleProcessFile = async () => {
    if (!file) {
      toast.error("Selecione um arquivo");
      return;
    }

    try {
      // File size validation (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Arquivo muito grande (máximo 5MB)');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Usuário não autenticado');
        return;
      }

      // Get user's current store
      const { data: userStores } = await supabase
        .from('user_stores')
        .select('store_id')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle();

      if (!userStores) {
        toast.error('Usuário não vinculado a nenhuma loja');
        return;
      }

      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());

        // Line count validation
        if (lines.length > 10000) {
          toast.error('Arquivo com muitas linhas (máximo 10.000)');
          return;
        }

        let validCount = 0;
        let errorCount = 0;

        for (const line of lines.slice(1)) { // Skip header
          const [date, description, amount, balance] = line.split(',');
          
          if (!date || !date.trim()) continue;

          // Validate date format
          const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
          if (!dateRegex.test(date.trim())) {
            errorCount++;
            continue;
          }

          const parsedAmount = parseFloat(amount || '0');
          const parsedBalance = parseFloat(balance || '0');
          
          if (isNaN(parsedAmount) || isNaN(parsedBalance)) {
            errorCount++;
            continue;
          }

          const cleanDescription = (description || '').substring(0, 200);

          const { error } = await supabase
            .from('bank_statement_lines')
            .insert({
              transaction_date: date.trim(),
              description: cleanDescription,
              amount: parsedAmount,
              balance: parsedBalance,
              store_id: userStores.store_id,
              matched: false,
            });

          if (error) {
            errorCount++;
          } else {
            validCount++;
          }
        }

        if (validCount > 0) {
          toast.success(`${validCount} linhas processadas!${errorCount > 0 ? ` (${errorCount} erros)` : ''}`);
        } else {
          toast.error('Nenhuma linha válida encontrada');
        }
        
        setFile(null);
      };
      
      reader.readAsText(file);
    } catch (error: any) {
      toast.error(`Erro: ${error.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Conciliação Bancária</h2>
        <p className="text-muted-foreground">Importe e concilie extratos bancários</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload de Extrato (CSV)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Arquivo CSV</Label>
            <Input type="file" accept=".csv" onChange={handleFileUpload} />
            <p className="text-sm text-muted-foreground">
              Formato: Data, Descrição, Valor, Saldo
            </p>
          </div>
          <Button onClick={handleProcessFile} disabled={!file}>
            <Upload className="mr-2 h-4 w-4" />
            Processar Extrato
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Linhas Não Conciliadas</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Implemente a lógica de exibição e conciliação aqui</p>
        </CardContent>
      </Card>
    </div>
  );
}