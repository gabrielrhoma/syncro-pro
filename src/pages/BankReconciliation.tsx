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
      const reader = new FileReader();
      reader.onload = async (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(1); // Remove header
        
        for (const line of lines) {
          const [date, description, amount, balance] = line.split(',');
          if (!date) continue;

          await supabase
            .from('bank_statement_lines')
            .insert({
              transaction_date: date,
              description: description || '',
              amount: parseFloat(amount || '0'),
              balance: parseFloat(balance || '0'),
            });
        }
      };
      
      reader.readAsText(file);
      toast.success("Extrato processado!");
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