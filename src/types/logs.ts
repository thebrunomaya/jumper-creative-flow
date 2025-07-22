export interface ErrorLog {
  id: string;
  created_at: string;
  error_type: string;
  message: string;
  stack_trace?: string;
  url?: string;
  user_email?: string;
  user_agent?: string;
  component_name?: string;
  severity: 'error' | 'warning' | 'info';
  resolved: boolean;
  metadata?: any;
}

export interface LogsFiltersData {
  dateRange: 'today' | '7days' | '30days' | 'custom';
  severity: 'all' | 'error' | 'warning' | 'info';
  status: 'all' | 'resolved' | 'unresolved';
  search: string;
  startDate?: string;
  endDate?: string;
}