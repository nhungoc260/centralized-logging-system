import React, { useState, useCallback } from 'react';
import { Layout } from '../components/layout/Layout';
import { LogTable } from '../components/logs/LogTable';
import { LogFilters } from '../components/logs/LogFilters';
import { useLogs, useServices } from '../hooks/useLogs';
import { LogQueryParams } from '../types';

const DEFAULT_FILTERS: LogQueryParams = { page: 1, limit: 50 };

export const LogsPage: React.FC = () => {
  const [filters, setFilters] = useState<LogQueryParams>(DEFAULT_FILTERS);
  const { data, isLoading } = useLogs(filters);
  const { data: services = [] } = useServices();

  const updateFilter = useCallback((partial: Partial<LogQueryParams>) => {
    setFilters((prev) => ({ ...prev, ...partial, page: 1 }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
  }, []);

  return (
    <Layout title="Logs Explorer" subtitle="Search and filter all log entries">
      <div className="space-y-4">
        <LogFilters
          filters={filters}
          services={services}
          onChange={updateFilter}
          onReset={resetFilters}
        />
        <LogTable
          logs={data?.logs || []}
          total={data?.total || 0}
          page={filters.page || 1}
          totalPages={data?.totalPages || 1}
          isLoading={isLoading}
          onPageChange={(p) => setFilters((f) => ({ ...f, page: p }))}
        />
      </div>
    </Layout>
  );
};
