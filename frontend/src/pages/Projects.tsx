import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import { PlusCircle, Edit3, Power, X, Save, ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getAllProjects,
  createProject,
  updateProject,
  deactivateProject,
  type Project,
} from '../services/projectService';

const PAGE_SIZE = 10;

export const Projects: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  // Data State
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);

  // Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (user?.role !== 'MANAGER') {
      navigate('/');
      return;
    }
    fetchProjects();
  }, [user, navigate]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const data = await getAllProjects();
      setProjects(data);
    } catch (err: any) {
      console.error('Failed to load projects', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Projects',
        text: err.response?.data?.message || 'Failed to load project records.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Pagination Logic
  const totalPages = Math.ceil(projects.length / PAGE_SIZE) || 1;
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const paginatedProjects = projects.slice(startIndex, startIndex + PAGE_SIZE);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Open Modal for Creating Project
  const handleOpenCreateModal = () => {
    setEditingProjectId(null);
    setName('');
    setDescription('');
    setIsModalOpen(true);
  };

  // Open Modal for Editing Project
  const handleOpenEditModal = (project: Project, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingProjectId(project._id);
    setName(project.name);
    setDescription(project.description || '');
    setIsModalOpen(true);
  };

  // Close Modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProjectId(null);
    setName('');
    setDescription('');
  };

  // Handle Form Submit (Create & Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      if (editingProjectId) {
        await updateProject(editingProjectId, { name, description });
        Swal.fire({
          icon: 'success',
          title: 'Project Updated',
          text: 'Project details updated successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        await createProject({ name, description });
        Swal.fire({
          icon: 'success',
          title: 'Project Created',
          text: 'New project created successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
      }
      handleCloseModal();
      fetchProjects();
    } catch (err: any) {
      console.error('Project save error:', err);
      Swal.fire({
        icon: 'error',
        title: editingProjectId ? 'Update Failed' : 'Creation Failed',
        text: err.response?.data?.message || 'Something went wrong while saving.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Handle Project Deactivation
  const handleDeactivate = async (id: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: `Deactivate ${projectName}?`,
      text: 'This project will be marked as inactive.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, deactivate',
    });

    if (result.isConfirmed) {
      try {
        await deactivateProject(id);
        Swal.fire({
          icon: 'success',
          title: 'Deactivated!',
          text: 'Project has been marked inactive.',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchProjects();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Deactivation Failed',
          text: err.response?.data?.message || 'Unable to deactivate project.',
        });
      }
    }
  };

  // Handle Project Activation using Update API
  const handleActivate = async (id: string, projectName: string, e: React.MouseEvent) => {
    e.stopPropagation();

    const result = await Swal.fire({
      title: `Activate ${projectName}?`,
      text: 'This project will be set to active status again.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#16a34a',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, activate',
    });

    if (result.isConfirmed) {
      try {
        // Re-activates using the update API payload with isActive: true
        await updateProject(id, { isActive: true } as any);
        Swal.fire({
          icon: 'success',
          title: 'Activated!',
          text: 'Project has been activated successfully.',
          timer: 1500,
          showConfirmButton: false,
        });
        fetchProjects();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Activation Failed',
          text: err.response?.data?.message || 'Unable to activate project.',
        });
      }
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="page-title text-2xl font-bold text-gray-900 dark:text-white">
            Project Management
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Manage projects, update descriptions, and toggle activation status.
          </p>
        </div>
        <button
          onClick={handleOpenCreateModal}
          className="btn-primary flex items-center space-x-2 px-4 py-2"
        >
          <PlusCircle className="w-5 h-5" />
          <span>Add Project</span>
        </button>
      </div>

      {/* Table Card */}
      <div className="card overflow-hidden bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse font-bold">
            Loading projects...
          </div>
        ) : projects.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-bold">
            No projects found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-gray-900/50">
                  <th className="table-header p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Project Name
                  </th>
                  <th className="table-header p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Description
                  </th>
                  <th className="table-header p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="table-header p-4 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                {paginatedProjects.map((project) => (
                  <tr
                    key={project._id}
                    className="table-row hover:bg-gray-50/50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                    onClick={() => {
                      // Navigate to dedicated project page when clicked
                      // navigate(`/projects/${project._id}`);
                      console.log(`Clicked project: ${project._id}`);
                    }}
                  >
                    <td className="table-cell p-4 font-bold text-gray-900 dark:text-white">
                      {project.name}
                    </td>
                    <td className="table-cell p-4 text-sm text-gray-600 dark:text-gray-300 max-w-md truncate">
                      {project.description || <span className="text-gray-400 italic">No description</span>}
                    </td>
                    <td className="table-cell p-4">
                      <span
                        className={`inline-block px-2.5 py-1 text-xs font-semibold rounded-full ${
                          project.isActive
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                        }`}
                      >
                        {project.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="table-cell p-4 text-right">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {project.isActive ? (
                          <>
                            <button
                              type="button"
                              onClick={(e) => handleOpenEditModal(project, e)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition-colors"
                              title="Edit Project"
                            >
                              <Edit3 size={18} />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => handleDeactivate(project._id, project.name, e)}
                              className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                              title="Deactivate Project"
                            >
                              <Power size={18} />
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={(e) => handleActivate(project._id, project.name, e)}
                            className="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg transition-colors"
                            title="Activate Project"
                          >
                            <RotateCcw size={18} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      {!loading && projects.length > 0 && (
        <div className="flex items-center justify-between gap-4">
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Page {currentPage} of {totalPages} ({projects.length} total projects)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              className="btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Previous page"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              type="button"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              className="btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Next page"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Project Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                {editingProjectId ? 'Edit Project' : 'Add New Project'}
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="projectName">
                  Project Name *
                </label>
                <input
                  id="projectName"
                  type="text"
                  required
                  placeholder="e.g. Client A / R&D"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1" htmlFor="projectDesc">
                  Description
                </label>
                <textarea
                  id="projectDesc"
                  rows={4}
                  placeholder="Enter project summary or category notes..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleCloseModal}
                  className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary flex items-center px-4 py-2"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {submitting ? 'Saving...' : editingProjectId ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};