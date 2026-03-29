export interface XQuery {
    page: number;
    limit: number;
    search: string;
    sort: {
      sortOrder: string;
      sortField: string;
    };
    filters: any;
    rawFilters: any;
  }
  