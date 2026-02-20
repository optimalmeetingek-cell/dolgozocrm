import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import { API } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save } from "lucide-react";

const categories = [
  "Felvitt dolgozók",
  "Hideg jelentkező",
  "Űrlapon jelentkezett",
  "Állásra jelentkezett",
  "Ingázó",
  "Szállásos"
];

export default function WorkerFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [workerTypes, setWorkerTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    worker_type_id: "",
    position: "",
    position_experience: "",
    category: "Felvitt dolgozók",
    address: "",
    email: "",
    experience: "",
    notes: ""
  });

  useEffect(() => {
    fetchInitialData();
  }, [id]);

  const fetchInitialData = async () => {
    try {
      const typesRes = await axios.get(`${API}/worker-types`);
      setWorkerTypes(typesRes.data);
      
      if (isEdit) {
        const workerRes = await axios.get(`${API}/workers/${id}`);
        setFormData({
          name: workerRes.data.name || "",
          phone: workerRes.data.phone || "",
          worker_type_id: workerRes.data.worker_type_id || "",
          position: workerRes.data.position || "",
          position_experience: workerRes.data.position_experience || "",
          category: workerRes.data.category || "Felvitt dolgozók",
          address: workerRes.data.address || "",
          email: workerRes.data.email || "",
          experience: workerRes.data.experience || "",
          notes: workerRes.data.notes || ""
        });
      }
    } catch (e) {
      toast.error("Hiba");
      if (isEdit) navigate("/workers");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.name.length < 2) {
      toast.error("Név minimum 2 karakter");
      return;
    }
    if (!formData.phone) {
      toast.error("Telefonszám kötelező");
      return;
    }
    if (!formData.worker_type_id) {
      toast.error("Válassz típust");
      return;
    }

    setLoading(true);
    try {
      if (isEdit) {
        await axios.put(`${API}/workers/${id}`, formData);
        toast.success("Mentve");
      } else {
        await axios.post(`${API}/workers`, formData);
        toast.success("Létrehozva");
      }
      navigate("/workers");
    } catch (e) {
      toast.error(e.response?.data?.detail || "Hiba");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4">
      <div className="flex items-center gap-3 mb-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/workers")} className="shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-xl font-bold text-slate-800">{isEdit ? "Szerkesztés" : "Új dolgozó"}</h1>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Dolgozó adatai</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Név *</Label>
                <Input value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="Kiss János" required className="h-9" data-testid="worker-name-input" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Telefon *</Label>
                <Input value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="+36 20 123 4567" required className="h-9" data-testid="worker-phone-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Típus *</Label>
                <Select value={formData.worker_type_id} onValueChange={(v) => setFormData({...formData, worker_type_id: v})}>
                  <SelectTrigger className="h-9" data-testid="worker-type-select"><SelectValue placeholder="Válassz" /></SelectTrigger>
                  <SelectContent>{workerTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Kategória</Label>
                <Select value={formData.category} onValueChange={(v) => setFormData({...formData, category: v})}>
                  <SelectTrigger className="h-9" data-testid="worker-category-select"><SelectValue /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-sm">Pozíció (szabadon beírható)</Label>
                <Input value={formData.position} onChange={(e) => setFormData({...formData, position: e.target.value})} placeholder="pl. Hegesztő, CNC gépkezelő" className="h-9" data-testid="worker-position-input" />
              </div>
              <div className="space-y-1">
                <Label className="text-sm">Email</Label>
                <Input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} placeholder="email@email.hu" className="h-9" data-testid="worker-email-input" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Pozíció tapasztalat</Label>
              <Textarea value={formData.position_experience} onChange={(e) => setFormData({...formData, position_experience: e.target.value})} placeholder="A pozícióval kapcsolatos tapasztalat, képzettség..." rows={2} data-testid="worker-position-exp-input" />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Lakcím</Label>
              <Input value={formData.address} onChange={(e) => setFormData({...formData, address: e.target.value})} placeholder="Budapest, Fő utca 1." className="h-9" data-testid="worker-address-input" />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Általános tapasztalat</Label>
              <Textarea value={formData.experience} onChange={(e) => setFormData({...formData, experience: e.target.value})} placeholder="Korábbi munkatapasztalatok..." rows={2} data-testid="worker-experience-input" />
            </div>

            <div className="space-y-1">
              <Label className="text-sm">Megjegyzések</Label>
              <Textarea value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} placeholder="Egyéb..." rows={2} data-testid="worker-notes-input" />
            </div>

            <div className="flex gap-2 pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => navigate("/workers")}>Mégse</Button>
              <Button type="submit" size="sm" disabled={loading} className="bg-indigo-600 hover:bg-indigo-700" data-testid="save-worker-btn">
                {loading ? "..." : <><Save className="w-4 h-4 mr-1" />{isEdit ? "Mentés" : "Létrehozás"}</>}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
