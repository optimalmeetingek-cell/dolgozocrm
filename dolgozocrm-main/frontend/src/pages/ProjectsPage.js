import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { API, useAuth } from "@/App";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Plus,
  Calendar,
  MapPin,
  Users,
  Edit2,
  Trash2,
  CheckCircle,
  Clock,
  Target,
  User
} from "lucide-react";

export default function ProjectsPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const res = await axios.get(`${API}/projects`);
      setProjects(res.data);
    } catch (e) {
      toast.error("Hiba a projektek betöltésekor");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    e.preventDefault();
    if (!window.confirm("Biztosan törlöd ezt a projektet?")) return;
    try {
      await axios.delete(`${API}/projects/${id}`);
      toast.success("Projekt törölve");
      fetchProjects();
    } catch (e) {
      toast.error("Hiba a törléskor");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  const activeProjects = projects.filter(p => !p.is_closed);
  const closedProjects = projects.filter(p => p.is_closed);

  const getProgressPercent = (current, expected) => {
    if (!expected || expected === 0) return 0;
    return Math.min(Math.round((current / expected) * 100), 100);
  };

  return (
    <div className="space-y-6 px-0 sm:px-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-800">Projektek</h1>
          <p className="text-slate-500 mt-1 text-sm sm:text-base">{projects.length} projekt összesen</p>
        </div>
        {user?.role === "admin" && (
          <Button 
            onClick={() => navigate("/projects/new")}
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 w-full sm:w-auto"
            data-testid="add-project-btn"
          >
            <Plus className="w-4 h-4 mr-2" />
            Új projekt
          </Button>
        )}
      </div>

      {/* Active Projects */}
      {activeProjects.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <Clock className="w-5 h-5 text-indigo-600" />
            Aktív projektek ({activeProjects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {activeProjects.map((project, index) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group bg-white rounded-xl border border-slate-200 p-4 sm:p-5 hover:border-indigo-200 hover:shadow-lg transition-all duration-200 animate-fade-in"
                style={{animationDelay: `${index * 0.05}s`}}
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-1">
                    {project.name}
                  </h3>
                  {user?.role === "admin" && (
                    <div className="flex gap-1 shrink-0 ml-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.preventDefault();
                          navigate(`/projects/${project.id}/edit`);
                        }}
                        data-testid={`edit-project-${project.id}`}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700"
                        onClick={(e) => handleDelete(project.id, e)}
                        data-testid={`delete-project-${project.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span>{new Date(project.date).toLocaleDateString('hu-HU')}</span>
                  </div>
                  {project.location && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <MapPin className="w-4 h-4 shrink-0" />
                      <span className="line-clamp-1">{project.location}</span>
                    </div>
                  )}
                  
                  {/* Ki hozta létre */}
                  {project.owner_name && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[8px] font-medium text-slate-600 shrink-0">
                        {project.owner_name.charAt(0)}
                      </div>
                      <span className="text-xs">{project.owner_name}</span>
                    </div>
                  )}
                  
                  {/* Létszám kijelző */}
                  <div className="pt-2">
                    <div className="flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1 text-slate-600">
                        <Users className="w-4 h-4" />
                        <span className="font-medium">{project.worker_count}</span>
                        {project.expected_workers > 0 && (
                          <span className="text-slate-400">/ {project.expected_workers}</span>
                        )}
                      </span>
                      {project.expected_workers > 0 && (
                        <span className={`text-xs font-medium ${
                          project.worker_count >= project.expected_workers 
                            ? 'text-green-600' 
                            : project.worker_count >= project.expected_workers * 0.7
                            ? 'text-amber-600'
                            : 'text-slate-500'
                        }`}>
                          {getProgressPercent(project.worker_count, project.expected_workers)}%
                        </span>
                      )}
                    </div>
                    {project.expected_workers > 0 && (
                      <Progress 
                        value={getProgressPercent(project.worker_count, project.expected_workers)} 
                        className="h-1.5"
                      />
                    )}
                  </div>
                </div>

                {project.notes && (
                  <p className="mt-3 text-sm text-slate-500 line-clamp-2">{project.notes}</p>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Closed Projects */}
      {closedProjects.length > 0 && (
        <div>
          <h2 className="text-base sm:text-lg font-semibold text-slate-700 mb-3 flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Lezárt projektek ({closedProjects.length})
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {closedProjects.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group bg-slate-50 rounded-xl border border-slate-200 p-4 sm:p-5 hover:bg-white transition-all"
                data-testid={`project-card-${project.id}`}
              >
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-semibold text-slate-600 line-clamp-1">
                    {project.name}
                  </h3>
                  <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 shrink-0 ml-2">
                    Lezárva
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-4 h-4" />
                    <span>{new Date(project.date).toLocaleDateString('hu-HU')}</span>
                  </div>
                  {/* Ki hozta létre */}
                  {project.owner_name && (
                    <div className="flex items-center gap-2 text-slate-500">
                      <div className="w-4 h-4 bg-slate-200 rounded-full flex items-center justify-center text-[8px] font-medium text-slate-600 shrink-0">
                        {project.owner_name.charAt(0)}
                      </div>
                      <span className="text-xs">{project.owner_name}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-slate-500">
                    <Users className="w-4 h-4" />
                    <span>{project.worker_count} dolgozó</span>
                    {project.expected_workers > 0 && (
                      <span className="text-slate-400">/ {project.expected_workers} elvárt</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}

      {projects.length === 0 && (
        <div className="bg-white rounded-xl border border-slate-200 p-8 sm:p-12 text-center">
          <Calendar className="w-12 h-12 text-slate-300 mx-auto mb-4" />
          <p className="text-slate-500">Még nincs projekt</p>
          {user?.role === "admin" && (
            <Button 
              onClick={() => navigate("/projects/new")}
              className="mt-4 bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Első projekt létrehozása
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
