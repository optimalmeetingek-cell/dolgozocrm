import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Plus,
  Search,
  Phone,
  Edit2,
  Trash2,
  FolderPlus,
  User,
  X,
  FileSpreadsheet,
  Eye
} from "lucide-react";

const categories = [
  { value: "Felvitt dolgozók", label: "Felvitt dolgozók", color: "bg-blue-100 text-blue-700" },
  { value: "Hideg jelentkező", label: "Hideg jelentkező", color: "bg-green-100 text-green-700" },
  { value: "Űrlapon jelentkezett", label: "Űrlapon", color: "bg-orange-100 text-orange-700" },
  { value: "Állásra jelentkezett", label: "Állásra", color: "bg-purple-100 text-purple-700" },
  { value: "Ingázó", label: "Ingázó", color: "bg-slate-100 text-slate-700" },
  { value: "Szállásos", label: "Szállásos", color: "bg-amber-100 text-amber-700" },
];

const getCategoryColor = (cat) => {
  const found = categories.find(c => c.value === cat);
  return found?.color || "bg-slate-100 text-slate-700";
};

const getCategoryLabel = (cat) => {
  const found = categories.find(c => c.value === cat);
  return found?.label || cat;
};

export default function WorkersPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [workers, setWorkers] = useState([]);
  const [workerTypes, setWorkerTypes] = useState([]);
  const [tags, setTags] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [tagFilter, setTagFilter] = useState("");
  const [ownerFilter, setOwnerFilter] = useState("");
  
  // Add to project dialog
  const [addToProjectOpen, setAddToProjectOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState(null);
  const [selectedProjectId, setSelectedProjectId] = useState("");

  useEffect(() => {
    fetchData();
  }, [search, categoryFilter, typeFilter, tagFilter, ownerFilter]);

  const fetchData = async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (categoryFilter) params.append("category", categoryFilter);
      if (typeFilter) params.append("worker_type_id", typeFilter);
      if (tagFilter) params.append("tag_id", tagFilter);
      if (ownerFilter) params.append("owner_id", ownerFilter);

      const [workersRes, typesRes, tagsRes, projectsRes] = await Promise.all([
        axios.get(`${API}/workers?${params}`),
        axios.get(`${API}/worker-types`),
        axios.get(`${API}/tags`),
        axios.get(`${API}/projects`),
      ]);
      
      setWorkers(workersRes.data);
      setWorkerTypes(typesRes.data);
      setTags(tagsRes.data);
      setProjects(projectsRes.data.filter(p => !p.is_closed));

      if (user?.role === "admin") {
        const usersRes = await axios.get(`${API}/users`);
        setUsers(usersRes.data);
      }
    } catch (e) {
      toast.error("Hiba az adatok betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm("Biztosan törlöd?")) return;
    try {
      await axios.delete(`${API}/workers/${id}`);
      toast.success("Dolgozó törölve");
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Hiba");
    }
  };

  const handleAddToProject = async () => {
    if (!selectedProjectId || !selectedWorker) return;
    try {
      await axios.post(`${API}/projects/${selectedProjectId}/workers`, {
        worker_id: selectedWorker.id
      });
      toast.success("Hozzáadva");
      setAddToProjectOpen(false);
      setSelectedWorker(null);
      setSelectedProjectId("");
      fetchData();
    } catch (e) {
      toast.error(e.response?.data?.detail || "Hiba");
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await axios.get(`${API}/export/workers`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dolgozok_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success("Letöltve");
    } catch (e) {
      toast.error("Hiba");
    }
  };

  const clearFilters = () => {
    setSearch("");
    setCategoryFilter("");
    setTypeFilter("");
    setTagFilter("");
    setOwnerFilter("");
  };

  const hasFilters = search || categoryFilter || typeFilter || tagFilter || ownerFilter;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-800">Dolgozók</h1>
          <p className="text-slate-500 text-sm">{workers.length} {hasFilters ? "(szűrve)" : "összesen"}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleExportExcel} data-testid="export-excel-btn">
            <FileSpreadsheet className="w-4 h-4" />
          </Button>
          <Button size="sm" onClick={() => navigate("/workers/new")} className="bg-indigo-600 hover:bg-indigo-700" data-testid="add-worker-btn">
            <Plus className="w-4 h-4 mr-1" />Új
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border p-3 flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[150px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input placeholder="Keresés..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-8 h-9" data-testid="search-input" />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[130px] h-9" data-testid="category-filter"><SelectValue placeholder="Kategória" /></SelectTrigger>
          <SelectContent>{categories.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[130px] h-9" data-testid="type-filter"><SelectValue placeholder="Típus" /></SelectTrigger>
          <SelectContent>{workerTypes.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}</SelectContent>
        </Select>
        {user?.role === "admin" && (
          <Select value={ownerFilter} onValueChange={setOwnerFilter}>
            <SelectTrigger className="w-[130px] h-9" data-testid="owner-filter"><SelectValue placeholder="Toborzó" /></SelectTrigger>
            <SelectContent>{users.map(u => <SelectItem key={u.id} value={u.id}>{u.name || u.email}</SelectItem>)}</SelectContent>
          </Select>
        )}
        {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}><X className="w-4 h-4" /></Button>}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50">
                <TableHead className="font-semibold">Név</TableHead>
                <TableHead className="font-semibold">Telefon</TableHead>
                <TableHead className="font-semibold hidden sm:table-cell">Pozíció</TableHead>
                <TableHead className="font-semibold hidden md:table-cell">Típus</TableHead>
                <TableHead className="font-semibold hidden lg:table-cell">Kategória</TableHead>
                {user?.role === "admin" && <TableHead className="font-semibold hidden xl:table-cell">Toborzó</TableHead>}
                <TableHead className="font-semibold hidden lg:table-cell">Projekt</TableHead>
                <TableHead className="w-[100px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {workers.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-slate-500">Nincs találat</TableCell></TableRow>
              ) : (
                workers.map((w) => (
                  <TableRow key={w.id} className="hover:bg-slate-50 cursor-pointer" onClick={() => navigate(`/workers/${w.id}`)} data-testid={`worker-row-${w.id}`}>
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 bg-indigo-100 rounded-full flex items-center justify-center text-xs font-semibold text-indigo-600 shrink-0">
                          {w.name.charAt(0)}
                        </div>
                        <span className="truncate max-w-[120px]">{w.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a href={`tel:${w.phone}`} onClick={(e) => e.stopPropagation()} className="text-slate-600 hover:text-indigo-600 flex items-center gap-1">
                        <Phone className="w-3 h-3" /><span className="text-sm">{w.phone}</span>
                      </a>
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      {w.position && <span className="text-sm text-slate-600">{w.position}</span>}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline" className="text-xs">{w.worker_type_name}</Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <Badge className={`${getCategoryColor(w.category)} text-xs border-0`}>{getCategoryLabel(w.category)}</Badge>
                    </TableCell>
                    {user?.role === "admin" && (
                      <TableCell className="hidden xl:table-cell">
                        <div className="flex items-center gap-1.5">
                          <div className="w-5 h-5 bg-slate-200 rounded-full flex items-center justify-center text-[10px] font-medium text-slate-600 shrink-0">
                            {w.owner_name?.charAt(0) || "?"}
                          </div>
                          <span className="text-xs text-slate-600 truncate max-w-[80px]">{w.owner_name}</span>
                        </div>
                      </TableCell>
                    )}
                    <TableCell className="hidden lg:table-cell">
                      {w.project_statuses?.[0] && (
                        <span className="text-xs bg-slate-100 px-2 py-0.5 rounded">
                          {w.project_statuses[0].project_name}: {w.project_statuses[0].status_name}
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/workers/${w.id}`)} data-testid={`view-worker-${w.id}`}>
                          <Eye className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setSelectedWorker(w); setAddToProjectOpen(true); }} data-testid={`add-to-project-${w.id}`}>
                          <FolderPlus className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigate(`/workers/${w.id}/edit`)} data-testid={`edit-worker-${w.id}`}>
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        {user?.role === "admin" && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-red-500 hover:text-red-700" onClick={(e) => handleDelete(w.id, e)} data-testid={`delete-worker-${w.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Dialog */}
      <Dialog open={addToProjectOpen} onOpenChange={setAddToProjectOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Projekthez adás</DialogTitle></DialogHeader>
          <div className="py-3">
            <p className="text-sm text-slate-600 mb-3"><strong>{selectedWorker?.name}</strong></p>
            <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
              <SelectTrigger><SelectValue placeholder="Válassz projektet" /></SelectTrigger>
              <SelectContent>{projects.map(p => <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setAddToProjectOpen(false)}>Mégse</Button>
            <Button size="sm" onClick={handleAddToProject} disabled={!selectedProjectId} className="bg-indigo-600">Hozzáad</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
