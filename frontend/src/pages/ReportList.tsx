import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { reportService } from '../services/reportService';
import { ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { getWeekOptions, type WeekOption } from '../utils/dateUtils';
import Swal from 'sweetalert2';

interface Report {
  _id: string;
  userId: { _id: string; name: string; email: string };
  projectId: { _id: string; name: string };
  weekStart: string;
  weekEnd: string;
  status: 'DRAFT' | 'SUBMITTED' | 'NEEDS_CORRECTION' | 'APPROVED';
  createdAt: string;
}

interface Project {
  _id: string;
  name: string;
}

interface ReportFilters {
  status: string;
  projectId: string;
  startDate: string;
  endDate: string;
}

interface ReportPagination {
  totalReports: number;
  currentPage: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

interface ReportListProps {
  userId?: string;
}

const PAGE_SIZE = 10;
const EMPTY_FILTERS: ReportFilters = {
  status: '',
  projectId: '',
  startDate: '',
  endDate: '',
};

export const ReportList: React.FC<ReportListProps> = ({ userId }) => {
  const [reports, setReports] = useState<Report[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [draftFilters, setDraftFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState<ReportFilters>(EMPTY_FILTERS);
  const [currentPage, setCurrentPage] = useState(1);
  const [pagination, setPagination] = useState<ReportPagination>({
    totalReports: 0,
    currentPage: 1,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: false,
  });
  const loadedPages = useRef(new Set<number>());
  const navigate = useNavigate();
  const weekOptions = getWeekOptions();

  const [selectedWeek, setSelectedWeek] = useState<WeekOption | null>(null);

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const params: any = { page: '1', limit: String(PAGE_SIZE) };
        if (userId) params.userId = userId;

        const [reportsResponse, projectsResponse] = await Promise.all([
          reportService.getReports(params),
          api.get<Project[]>('/projects'),
        ]);
        setReports(reportsResponse.data);
        setPagination(reportsResponse.pagination);
        loadedPages.current.add(1);
        setProjects(projectsResponse.data);
      } catch (err) {
        console.error('Failed to fetch reports or projects', err);
        Swal.fire({
          icon: 'error',
          title: 'Error Loading Data',
          text: 'Failed to fetch reports or projects. Please try again later.',
        });
      } finally {
        setLoading(false);
      }
    };
    fetchInitialData();
  }, [userId]);

  const loadReports = async (page: number, filters: ReportFilters, append: boolean) => {
    try {
      setLoading(true);
      const params: any = { page: String(page), limit: String(PAGE_SIZE) };
      if (userId) params.userId = userId;

      Object.entries(filters).forEach(([key, value]) => {
        if (value) params[key] = value;
      });

      const data = await reportService.getReports(params);
      setReports((existingReports) => (append ? [...existingReports, ...data.data] : data.data));
      setPagination(data.pagination);
      loadedPages.current.add(page);
      return data.pagination;
    } catch (err) {
      console.error('Failed to fetch reports', err);
      Swal.fire({
        icon: 'error',
        title: 'Error Loading Reports',
        text: 'Failed to fetch reports for the selected page.',
      });
      return null;
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = async (event: React.FormEvent) => {
    event.preventDefault();
    const nextFilters = { ...draftFilters };
    setAppliedFilters(nextFilters);
    setCurrentPage(1);
    setReports([]);
    loadedPages.current.clear();
    await loadReports(1, nextFilters, false);
  };

  const handlePageChange = async (nextPage: number) => {
    if (nextPage < 1 || nextPage > pagination.totalPages || nextPage === currentPage || loading) {
      return;
    }

    if (!loadedPages.current.has(nextPage)) {
      const nextPagination = await loadReports(nextPage, appliedFilters, true);
      if (!nextPagination) return;
    }

    setCurrentPage(nextPage);
  };

  const visibleReports = reports.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case 'APPROVED':
        return <span className="badge badge-success">Approved</span>;
      case 'SUBMITTED':
        return <span className="badge badge-info">Submitted</span>;
      case 'NEEDS_CORRECTION':
        return <span className="badge badge-warning">Needs Correction</span>;
      default:
        return <span className="badge badge-default">Draft</span>;
    }
  };

  // Week Selector Handler
  const handleWeekSelect = (identifier: string) => {
    const found = weekOptions.find((w) => w.weekIdentifier === identifier);
    if (found) {
      setSelectedWeek(found);
      setDraftFilters((filters) => ({
        ...filters,
        startDate: found.weekStart,
        endDate: found.weekEnd,
      }));
    } else {
      setSelectedWeek(null);
      setDraftFilters((filters) => ({
        ...filters,
        startDate: '',
        endDate: '',
      }));
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {!userId && <h1 className="page-title mb-6">All Reports</h1>}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <form onSubmit={handleFilter} className="card p-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-5 gap-3 w-full">
          <select
            value={draftFilters.status}
            onChange={(e) => setDraftFilters((filters) => ({ ...filters, status: e.target.value }))}
            className="input-field !p-2"
          >
            <option value="">All Statuses</option>
            <option value="DRAFT">Draft</option>
            <option value="SUBMITTED">Submitted</option>
            <option value="NEEDS_CORRECTION">Needs Correction</option>
            <option value="APPROVED">Approved</option>
          </select>
          <select
            value={draftFilters.projectId}
            onChange={(e) => setDraftFilters((filters) => ({ ...filters, projectId: e.target.value }))}
            className="input-field !p-2"
          >
            <option value="">All Projects</option>
            {projects.map((project) => (
              <option key={project._id} value={project._id}>
                {project.name}
              </option>
            ))}
          </select>
          <div>
            <select
              value={selectedWeek?.weekIdentifier || ''}
              onChange={(e) => handleWeekSelect(e.target.value)}
              className="input-field"
            >
              <option value="">All Weeks</option>
              {weekOptions.map((w) => (
                <option key={w.weekIdentifier} value={w.weekIdentifier}>
                  {w.label}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="btn-primary !py-2 flex items-center justify-center gap-2">
            <Filter size={16} />
            Filter
          </button>
          <button
            type="button"
            className="btn-secondary !py-2 flex items-center justify-center gap-2"
            onClick={() => {
              setSelectedWeek(null);
              setDraftFilters(EMPTY_FILTERS);
            }}
          >
            Reset
          </button>
        </form>
      </div>

      <div className="card overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 animate-pulse font-bold">
            Loading reports...
          </div>
        ) : reports.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400 font-bold">
            No reports found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr>
                  {!userId && <th className="table-header">Member</th>}
                  <th className="table-header">Project</th>
                  <th className="table-header">Week Duration</th>
                  <th className="table-header">Status</th>
                  <th className="table-header">Submitted At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200/50 dark:divide-white/10">
                {visibleReports.map((report) => (
                  <tr
                    key={report._id}
                    className="table-row"
                    onClick={() => navigate(`/reports/${report._id}`)}
                  >
                    {!userId && (
                      <td className="table-cell font-bold text-gray-900 dark:text-white">
                        {report.userId?.name || 'Unknown'}
                      </td>
                    )}
                    <td className="table-cell font-bold">
                      {report.projectId?.name || 'N/A'}
                    </td>
                    <td className="table-cell">
                      {new Date(report.weekStart).toLocaleDateString()} -{' '}
                      {new Date(report.weekEnd).toLocaleDateString()}
                    </td>
                    <td className="table-cell">{getStatusBadge(report.status)}</td>
                    <td className="table-cell text-xs font-semibold text-gray-500">
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between gap-4">
        <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">
          Page {currentPage} of {pagination.totalPages}
        </span>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={!pagination.hasPrevPage || loading || currentPage === 0}
            className="btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Previous page"
          >
            <ChevronLeft size={18} />
          </button>
          <button
            type="button"
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === pagination.totalPages || loading}
            className="btn-secondary !p-2 disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label="Next page"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};