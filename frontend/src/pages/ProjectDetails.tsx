import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import {
  ArrowLeft,
  Users,
  UserPlus,
  Trash2,
  Edit3,
  Power,
  RotateCcw,
  Check,
  X,
  Mail,
  Shield,
  Calendar,
  ExternalLink,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import {
  getProject,
  updateProject,
  deactivateProject,
  getTeamMembers,
  type Project,
  type UserMember,
} from '../services/projectService';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [project, setProject] = useState<Project | null>(null);
  const [availableMembers, setAvailableMembers] = useState<UserMember[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState<boolean>(false);
  const [editName, setEditName] = useState<string>('');
  const [editDescription, setEditDescription] = useState<string>('');
  const [updatingDetails, setUpdatingDetails] = useState<boolean>(false);

  // Add Member Modal State
  const [isMemberModalOpen, setIsMemberModalOpen] = useState<boolean>(false);
  const [selectedMemberIds, setSelectedMemberIds] = useState<string[]>([]);
  const [savingMembers, setSavingMembers] = useState<boolean>(false);

  useEffect(() => {
    if (user?.role !== 'MANAGER' && user?.role !== 'ADMIN') {
      navigate('/');
      return;
    }
    if (id) {
      fetchProjectDetails();
    }
  }, [id, user, navigate]);

  const fetchProjectDetails = async () => {
    setLoading(true);
    try {
      const projectData = await getProject(id!);
      setProject(projectData);
    } catch (err: any) {
      console.error('Failed to fetch project details', err);
      Swal.fire({
        icon: 'error',
        title: 'Project Not Found',
        text: err.response?.data?.message || 'Could not retrieve project information.',
      });
      navigate('/projects');
    } finally {
      setLoading(false);
    }
  };

  const openAddMemberModal = async () => {
    try {
      const membersList = await getTeamMembers();
      setAvailableMembers(membersList);
      const currentIds = (project?.members || []).map((m) => m._id);
      setSelectedMemberIds(currentIds);
      setIsMemberModalOpen(true);
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Members',
        text: err.response?.data?.message || 'Failed to fetch available team members.',
      });
    }
  };

  const handleToggleMemberSelection = (memberId: string) => {
    setSelectedMemberIds((prev) =>
      prev.includes(memberId)
        ? prev.filter((mId) => mId !== memberId)
        : [...prev, memberId]
    );
  };

  const handleSaveMembers = async () => {
    if (!project) return;
    setSavingMembers(true);

    try {
      const updated = await updateProject(project._id, {
        members: selectedMemberIds,
      });
      setProject(updated);
      setIsMemberModalOpen(false);
      Swal.fire({
        icon: 'success',
        title: 'Members Updated',
        text: 'Project team members have been updated successfully.',
        timer: 1500,
        showConfirmButton: false,
      });
      await fetchProjectDetails();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Update Failed',
        text: err.response?.data?.message || 'Could not update project members.',
      });
    } finally {
      setSavingMembers(false);
    }
  };

  const handleRemoveMember = async (e: React.MouseEvent, memberId: string, memberName: string) => {
    // Prevent row click navigation when clicking the delete button
    e.stopPropagation();

    if (!project) return;

    const result = await Swal.fire({
      title: `Remove ${memberName}?`,
      text: 'This user will be removed from the project team.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: 'Yes, remove',
    });

    if (result.isConfirmed) {
      try {
        const remainingMemberIds = (project.members || [])
          .filter((m) => m._id !== memberId)
          .map((m) => m._id);

        await updateProject(project._id, { members: remainingMemberIds });
        Swal.fire({
          icon: 'success',
          title: 'Member Removed',
          text: `${memberName} has been removed from the project.`,
          timer: 1500,
          showConfirmButton: false,
        });
        await fetchProjectDetails();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Action Failed',
          text: err.response?.data?.message || 'Could not remove team member.',
        });
      }
    }
  };

  const openEditDetailsModal = () => {
    if (!project) return;
    setEditName(project.name);
    setEditDescription(project.description || '');
    setIsEditModalOpen(true);
  };

  const handleSaveDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!project || !editName.trim()) return;

    setUpdatingDetails(true);
    try {
      await updateProject(project._id, {
        name: editName.trim(),
        description: editDescription.trim(),
      });
      Swal.fire({
        icon: 'success',
        title: 'Project Updated',
        text: 'Project details have been saved.',
        timer: 1500,
        showConfirmButton: false,
      });
      setIsEditModalOpen(false);
      await fetchProjectDetails();
    } catch (err: any) {
      Swal.fire({
        icon: 'error',
        title: 'Save Failed',
        text: err.response?.data?.message || 'Failed to update project details.',
      });
    } finally {
      setUpdatingDetails(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!project) return;
    const nextStatus = !project.isActive;
    const actionText = nextStatus ? 'activate' : 'deactivate';

    const result = await Swal.fire({
      title: `${nextStatus ? 'Activate' : 'Deactivate'} Project?`,
      text: `Are you sure you want to ${actionText} "${project.name}"?`,
      icon: nextStatus ? 'question' : 'warning',
      showCancelButton: true,
      confirmButtonColor: nextStatus ? '#10B981' : '#EF4444',
      cancelButtonColor: '#6B7280',
      confirmButtonText: `Yes, ${actionText}`,
    });

    if (result.isConfirmed) {
      try {
        if (nextStatus) {
          await updateProject(project._id, { isActive: true });
        } else {
          await deactivateProject(project._id);
        }
        Swal.fire({
          icon: 'success',
          title: `Project ${nextStatus ? 'Activated' : 'Deactivated'}`,
          text: `The project is now ${nextStatus ? 'active' : 'inactive'}.`,
          timer: 1500,
          showConfirmButton: false,
        });
        await fetchProjectDetails();
      } catch (err: any) {
        Swal.fire({
          icon: 'error',
          title: 'Status Update Failed',
          text: err.response?.data?.message || 'Could not update project status.',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto p-6 md:p-10 text-center">
        <div className="p-12 text-gray-500 dark:text-gray-400 animate-pulse font-bold text-lg">
          Loading project details...
        </div>
      </div>
    );
  }

  if (!project) return null;

  return (
    <div className="max-w-7xl mx-auto p-6 md:p-10 space-y-8">
      {/* Top Navigation */}
      <button
        onClick={() => navigate('/projects')}
        className="flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors"
      >
        <ArrowLeft size={18} />
        Back to Projects
      </button>

      {/* Header Card */}
      <div className="card p-6 md:p-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {project.name}
              </h1>
              <span
                className={`px-3 py-1 text-xs font-semibold rounded-full ${
                  project.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                }`}
              >
                {project.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
            {project.createdAt && (
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                <Calendar size={14} />
                Created on {new Date(project.createdAt).toLocaleDateString()}
              </div>
            )}
          </div>

          {/* Header Action Buttons */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={openEditDetailsModal}
              className="btn-secondary flex items-center gap-2 px-4 py-2 text-sm"
            >
              <Edit3 size={16} />
              Edit Details
            </button>
            <button
              onClick={handleToggleStatus}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-colors ${
                project.isActive
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/30 dark:hover:bg-red-900/50'
                  : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/50'
              }`}
            >
              {project.isActive ? <Power size={16} /> : <RotateCcw size={16} />}
              {project.isActive ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </div>

        {/* Description Section */}
        <div>
          <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
            Description
          </h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
            {project.description || (
              <span className="italic text-gray-400">No description provided for this project.</span>
            )}
          </p>
        </div>
      </div>

      {/* Team Members Section */}
      <div className="card p-6 md:p-8 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200/50 dark:border-white/10 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 dark:border-gray-700 pb-4">
          <div className="flex items-center gap-3">
            <Users className="text-indigo-600 dark:text-indigo-400" size={24} />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Assigned Team Members ({project.members?.length || 0})
            </h2>
          </div>
          <button
            onClick={openAddMemberModal}
            className="btn-primary flex items-center gap-2 px-4 py-2 text-sm"
          >
            <UserPlus size={16} />
            Manage Team Members
          </button>
        </div>

        {/* Interactive Member Table */}
        {!project.members || project.members.length === 0 ? (
          <div className="p-8 text-center border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl">
            <Users size={36} className="mx-auto text-gray-400 mb-2" />
            <p className="text-gray-500 dark:text-gray-400 font-medium">
              No team members assigned yet.
            </p>
            <button
              onClick={openAddMemberModal}
              className="mt-3 text-sm text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 font-semibold"
            >
              + Add Members Now
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
            <table className="w-full text-left text-sm text-gray-600 dark:text-gray-300">
              <thead className="bg-gray-50 dark:bg-gray-900/50 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th scope="col" className="px-6 py-4">
                    Member Name
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Email Address
                  </th>
                  <th scope="col" className="px-6 py-4">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-4 text-right">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {project.members.map((member) => (
                  <tr
                    key={member._id}
                    onClick={() => navigate(`/users/${member._id}`)}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors group"
                  >
                    <td className="px-6 py-4 font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        <span>{member.name}</span>
                        <ExternalLink size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300">
                        <Mail size={14} className="text-gray-400" />
                        <span>{member.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.role ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800/50">
                          <Shield size={12} />
                          {member.role}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">N/A</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <button
                        onClick={(e) => handleRemoveMember(e, member._id, member.name)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-lg transition-colors"
                        title="Remove from project"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Details Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                Edit Project Details
              </h3>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDetails} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Project Name *
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  rows={4}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg dark:bg-gray-900 border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  disabled={updatingDetails}
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updatingDetails}
                  className="btn-primary px-4 py-2"
                >
                  {updatingDetails ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Team Members Modal */}
      {isMemberModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="flex justify-between items-center px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  Manage Project Team
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Select team members to assign to this project.
                </p>
              </div>
              <button
                onClick={() => setIsMemberModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-3 flex-1">
              {availableMembers.length === 0 ? (
                <p className="text-center text-gray-500 py-6">
                  No active team members found in the organization.
                </p>
              ) : (
                availableMembers.map((member) => {
                  const isSelected = selectedMemberIds.includes(member._id);
                  return (
                    <div
                      key={member._id}
                      onClick={() => handleToggleMemberSelection(member._id)}
                      className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer transition-all ${
                        isSelected
                          ? 'border-indigo-500 bg-indigo-50/60 dark:bg-indigo-950/40'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                      }`}
                    >
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {member.email}
                        </p>
                      </div>

                      <div
                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition-colors ${
                          isSelected
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900'
                        }`}
                      >
                        {isSelected && <Check size={14} />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
              <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">
                {selectedMemberIds.length} member(s) selected
              </span>
              <div className="flex gap-3">
                <button
                  type="button"
                  disabled={savingMembers}
                  onClick={() => setIsMemberModalOpen(false)}
                  className="px-4 py-2 border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 text-sm font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingMembers}
                  onClick={handleSaveMembers}
                  className="btn-primary px-4 py-2 text-sm"
                >
                  {savingMembers ? 'Saving...' : 'Save Assignments'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};