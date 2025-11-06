import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Shield } from "lucide-react";

export default function FiscalSettings() {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<{
    company_name: string;
    cnpj: string;
    state_registration: string;
    tax_regime: "simples_nacional" | "lucro_presumido" | "lucro_real";
    certificate_password: string;
    certificate_expires_at: string;
    sefaz_environment: "homologation" | "production";
  }>({
    company_name: "",
    cnpj: "",
    state_registration: "",
    tax_regime: "simples_nacional",
    certificate_password: "",
    certificate_expires_at: "",
    sefaz_environment: "homologation",
  });
  const [settingsId, setSettingsId] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const { data } = await supabase
      .from('company_settings')
      .select('*')
      .single();

    if (data) {
      setSettingsId(data.id);
      setFormData({
        company_name: data.company_name || "",
        cnpj: data.cnpj || "",
        state_registration: data.state_registration || "",
        tax_regime: data.tax_regime || "simples_nacional",
        certificate_password: "",
        certificate_expires_at: data.certificate_expires_at ? new Date(data.certificate_expires_at).toISOString().split('T')[0] : "",
        sefaz_environment: data.sefaz_environment || "homologation",
      });
    }
    setLoading(false);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    const dataToSave = {
      company_name: formData.company_name,
      cnpj: formData.cnpj,
      state_registration: formData.state_registration,
      tax_regime: formData.tax_regime,
      certificate_password: formData.certificate_password || null,
      certificate_expires_at: formData.certificate_expires_at || null,
      sefaz_environment: formData.sefaz_environment,
    };

    if (settingsId) {
      const { error } = await supabase
        .from('company_settings')
        .update(dataToSave)
        .eq('id', settingsId);

      if (error) {
        toast.error("Erro ao atualizar configurações");
      } else {
        toast.success("Configurações atualizadas!");
      }
    } else {
      const { data, error } = await supabase
        .from('company_settings')
        .insert(dataToSave)
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar configurações");
      } else {
        setSettingsId(data.id);
        toast.success("Configurações salvas!");
      }
    }
  };

  if (loading) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Configurações Fiscais</h2>
        <p className="text-muted-foreground">Configure os dados para emissão de documentos fiscais</p>
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Dados da Empresa
            </CardTitle>
            <CardDescription>
              Informações cadastrais da empresa
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="company_name">Razão Social *</Label>
                <Input
                  id="company_name"
                  value={formData.company_name}
                  onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cnpj">CNPJ *</Label>
                <Input
                  id="cnpj"
                  value={formData.cnpj}
                  onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                  placeholder="00.000.000/0000-00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_registration">Inscrição Estadual</Label>
                <Input
                  id="state_registration"
                  value={formData.state_registration}
                  onChange={(e) => setFormData({ ...formData, state_registration: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="tax_regime">Regime Tributário *</Label>
                <Select value={formData.tax_regime} onValueChange={(value) => setFormData({ ...formData, tax_regime: value as "simples_nacional" | "lucro_presumido" | "lucro_real" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="simples_nacional">Simples Nacional</SelectItem>
                    <SelectItem value="lucro_presumido">Lucro Presumido</SelectItem>
                    <SelectItem value="lucro_real">Lucro Real</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Certificado Digital
            </CardTitle>
            <CardDescription>
              Certificado A1 para assinatura de documentos fiscais
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="certificate_password">Senha do Certificado</Label>
                <Input
                  id="certificate_password"
                  type="password"
                  value={formData.certificate_password}
                  onChange={(e) => setFormData({ ...formData, certificate_password: e.target.value })}
                  placeholder="Senha do arquivo .pfx"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="certificate_expires_at">Validade do Certificado</Label>
                <Input
                  id="certificate_expires_at"
                  type="date"
                  value={formData.certificate_expires_at}
                  onChange={(e) => setFormData({ ...formData, certificate_expires_at: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sefaz_environment">Ambiente SEFAZ *</Label>
                <Select value={formData.sefaz_environment} onValueChange={(value) => setFormData({ ...formData, sefaz_environment: value as "homologation" | "production" })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="homologation">Homologação (Teste)</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="bg-muted p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Nota:</strong> O upload do certificado digital (.pfx) será implementado em breve. 
                Por enquanto, a integração fiscal operará em modo de desenvolvimento.
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit">
            Salvar Configurações
          </Button>
        </div>
      </form>
    </div>
  );
}