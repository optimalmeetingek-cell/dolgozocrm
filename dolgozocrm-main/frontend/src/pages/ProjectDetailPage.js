import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  Edit2,
  Calendar,
  MapPin,
  Users,
  Plus,
  X,
  Phone,
  User,
  Lock,
  Unlock,
  Target,
  UserPlus,
  MessageSquare,
  Save
} from "lucide-react";

const getStatusColor = (statusName) => {
  const negativeStatuses = ["Nem jelent meg", "Nem felelt meg", "Lemondta"];
  const positiveStatuses = ["Megfelelt", "Dolgozik", "Megerősítve"];
  
  if (negativeStatuses.includes(statusName)) return "bg-red-100 text-red-700";
  if (positiveStatuses.includes(statusName)) return "bg-green-100 text-green-700";
  return "bg-slate-100 text-slate-700";
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [statuses, setStatuses] = useState([]);
  const [availableWorkers, setAvailableWorkers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddWorker, setShowAddWorker] = useState(false);
  const [showAddRecruiter, setShowAddRecruiter] = useState(false);
  
  // Status change dialog
  const [statusDialog, setStatusDialog] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState("");
  const [statusNotes, setStatusNotes] = useState("");

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const [projectRes, statusesRes, workersRes] = await Promise.all([
        axios.get(`${API}/projects/${id}`),
        axios.get(`${API}/statuses`),
        axios.get(`${API}/workers`)
      ]);
      
      setProject(projectRes.data);
      setStatuses(statusesRes.data);
      
      const projectWorkerIds = projectRes.data.workers.map(w => w.id);
      setAvailableWorkers(workersRes.data.filter(w => !projectWorkerIds.includes(w.id)));
      
      if (user?.role === "admin") {
        const usersRes = await axios.get(`${API}/users`);
        setAllUsers(usersRes.data.filter(u => u.role === "user"));
      }
    } catch (e) {
      toast.error("Projekt nem található");
      navigate("/projects");
    } finally {
      setLoading(false);
    }
  };

  const handleAddWorker = async (workerId) => {
    try {
      await axios.post(`${API}/projects/${id}/workers`, { worker_id: workerId });
      toast.success("Hozzáadva");
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Hiba");
    }
  };

  const handleRemoveWorker = async (workerId) => {
    try {
      await axios.delete(`${API}/projects/${id}/workers/${workerId}`);
      toast.success("Eltávolítva");
      fetchData();
    } catch (e) {
      toast.error("Hiba");
    }
  };

  const openStatusDialog = (worker) => {
    setSelectedWorker(worker);
    setSelectedStatus(worker.status_id || "");
    setStatusNotes(worker.notes || "");
    setStatusDialog(true);
  };

  const handleSaveStatus = async () => {
    if (!selectedWorker || !selectedStatus) return;
    try {
      await axios.put(`${API}/projects/${id}/workers/${selectedWorker.id}/status`, { 
        status_id: selectedStatus,
        notes: statusNotes 
      });
      toast.success("Státusz mentve");
      setStatusDialog(false);
      setSelectedWorker(null);
      setSelectedStatus("");
      setStatusNotes("");
      fetchData();
    } catch (e) {
      toast.error("Hiba");
    }
  };

  const handleQuickStatusChange = async (workerId, statusId) => {
    try {
      await axios.put(`${API}/projects/${id}/workers/${workerId}/status`, { status_id: statusId });
      toast.success("Mentve");
      fetchData();
    } catch (e) {
      toast.error("Hiba");
    }
  };

  const handleToggleClosed = async () => {
    try {
      await axios.put(`${API}/projects/${id}`, { is_closed: !project.is_closed });
      toast.success(project.is_closed ? "Újranyitva" : "Lezárva");
      fetchData();
    } catch (e) {
      toast.error("Hiba");
    }
  };

  const handleAddRecruiter = async (userId) => {
    try {
      await axios.post(`${API}/projects/${id}/recruiters`, { user_id: userId });
      toast.success("Toborzó hozzárendelve");
      fetchData();
    } catch (e) {
      toast.error("Hiba");
    }
  };

  const handleRemoveRecruiter = async (userId) => {
    try {
      await axios.delete(`${API}/projects/${id}/recruiters/${userId}`);
      toast.success("Toborzó eltávolítva");
      fetchData();
    } catch (e) {
      toast.error("Hiba");
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div></div>;
  }

  if (!project) return null;

  const progressPercent = project.expected_workers > 0 ? Math.min(Math.round((project.worker_count / project.expected_workers) * 100), 100) : 0;
  const availableRecruiters = allUsers.filter(u => !project.recruiter_ids?.includes(u.id));

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/projects")} className="shrink-0 mt-0.5">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl font-bold text-slate-800">{project.name}</h1>
            {project.is_closed && <Badge className="bg-green-100 text-green-700 border-0 text-xs">Lezárva</Badge>}
          </div>
          <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-slate-500">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(project.date).toLocaleDateString('hu-HU')}</span>
            {project.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{project.location}</span>}
            {project.owner_name && (
              <span className="flex items-center gap-1">
                <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[9px] font-medium text-slate-600">
                  {project.owner_name.charAt(0)}
                </div>
                {project.owner_name}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user?.role === "admin" && (
            <>
              <Switch checked={project.is_closed} onCheckedChange={handleToggleClosed} id="closed" />
              <Label htmlFor="closed" className="text-xs cursor-pointer">{project.is_closed ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}</Label>
              <Button variant="outline" size="sm" onClick={() => navigate(`/projects/${id}/edit`)}><Edit2 className="w-4 h-4" /></Button>
            </>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <div className="bg-white rounded-lg border p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-4 h-4 text-indigo-600" />
            <span className="text-xs text-slate-500">Létszám</span>
          </div>
          <p className="text-lg font-bold">{project.worker_count}<span className="text-slate-400 font-normal text-sm">/{project.expected_workers || '∞'}</span></p>
          {project.expected_workers > 0 && <Progress value={progressPercent} className="h-1 mt-1" />}
        </div>
        
        {user?.role === "admin" && (
          <div className="bg-white rounded-lg border p-3">
            <div className="flex items-center gap-2 mb-1">
              <UserPlus className="w-4 h-4 text-indigo-600" />
              <span className="text-xs text-slate-500">Toborzók</span>
            </div>
            <div className="flex flex-wrap gap-1">
              {project.recruiters?.map(r => (
                <Badge key={r.id} variant="secondary" className="text-xs gap-1 pr-1">
                  {r.name}
                  <button onClick={() => handleRemoveRecruiter(r.id)} className="hover:bg-slate-300 rounded"><X className="w-3 h-3" /></button>
                </Badge>
              ))}
              {availableRecruiters.length > 0 && (
                <Button variant="ghost" size="sm" className="h-5 text-xs px-1" onClick={() => setShowAddRecruiter(!showAddRecruiter)}>
                  <Plus className="w-3 h-3" />
                </Button>
              )}
            </div>
            {showAddRecruiter && availableRecruiters.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2 pt-2 border-t">
                {availableRecruiters.map(r => (
                  <Button key={r.id} variant="outline" size="sm" className="h-6 text-xs" onClick={() => handleAddRecruiter(r.id)}>
                    {r.name || r.email}
                  </Button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {project.notes && <div className="bg-white rounded-lg border p-3 text-sm text-slate-600">{project.notes}</div>}

      {/* Workers */}
      <div className="bg-white rounded-lg border">
        <div className="p-3 border-b flex items-center justify-between">
          <span className="font-semibold text-sm flex items-center gap-2"><Users className="w-4 h-4 text-indigo-600" />Dolgozók ({project.workers.length})</span>
          <Button variant="outline" size="sm" onClick={() => setShowAddWorker(!showAddWorker)}>
            {showAddWorker ? <X className="w-4 h-4" /> : <><Plus className="w-4 h-4 mr-1" />Hozzáad</>}
          </Button>
        </div>

        {showAddWorker && (
          <div className="p-3 bg-slate-50 border-b">
            {availableWorkers.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {availableWorkers.map(w => (
                  <div key={w.id} className="flex items-center justify-between p-2 bg-white rounded border text-sm">
                    <span className="truncate">{w.name}</span>
                    <Button size="sm" className="h-6 w-6 p-0 bg-indigo-600" onClick={() => handleAddWorker(w.id)}><Plus className="w-3 h-3" /></Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Nincs elérhető dolgozó</p>
            )}
          </div>
        )}

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Név</TableHead>
                <TableHead className="font-semibold">Telefon</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Kategória</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Felvitte</TableHead>
                <TableHead className="font-semibold">Státusz</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Megjegyzés</TableHead>
                <TableHead className="w-[80px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {project.workers.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-slate-500">Nincs dolgozó</TableCell></TableRow>
              ) : (
                project.workers.map(w => (
                  <TableRow key={w.id} className={w.notes ? "bg-amber-50/30" : ""}>
                    <TableCell className="font-medium">
                      <Link to={`/workers/${w.id}`} className="hover:text-indigo-600">{w.name}</Link>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${w.phone}`} className="flex items-center gap-1 text-slate-600 hover:text-indigo-600">
                        <Phone className="w-3 h-3" />{w.phone}
                      </a>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">{w.category}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-xs text-slate-500">{w.added_by}</TableCell>
                    <TableCell>
                      <Select value={w.status_id || ""} onValueChange={(v) => handleQuickStatusChange(w.id, v)}>
                        <SelectTrigger className={`h-8 w-[140px] ${getStatusColor(w.status_name)}`}>
                          <SelectValue placeholder="Státusz" />
                        </SelectTrigger>
                        <SelectContent>{statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}</SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      {w.notes ? (
                        <span className="text-xs text-slate-600 truncate max-w-[150px] block" title={w.notes}>{w.notes}</span>
                      ) : (
                        <span className="text-xs text-slate-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-7 w-7" 
                          onClick={() => openStatusDialog(w)}
                          title="Megjegyzés hozzáadása"
                          data-testid={`add-notes-${w.id}`}
                        >
                          <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500" onClick={() => handleRemoveWorker(w.id)}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Status/Notes Dialog */}
      <Dialog open={statusDialog} onOpenChange={setStatusDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Státusz és megjegyzés - {selectedWorker?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Státusz</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger data-testid="status-select">
                  <SelectValue placeholder="Válassz státuszt" />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Megjegyzés</Label>
              <Textarea 
                value={statusNotes} 
                onChange={(e) => setStatusNotes(e.target.value)}
                placeholder="pl. Nem jelent meg, nem vette fel a telefont..."
                rows={3}
                data-testid="status-notes-input"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setStatusDialog(false)}>Mégse</Button>
            <Button onClick={handleSaveStatus} disabled={!selectedStatus} className="bg-indigo-600" data-testid="save-status-btn">
              <Save className="w-4 h-4 mr-2" />Mentés
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
