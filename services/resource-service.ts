import api from "./api-client"

export type SortOrder = "asc" | "desc"

export interface QueryParams {
  page?: number
  per_page?: number
  sort_by?: string
  sort_order?: SortOrder
  filters?: Record<string, string>
  search?: string;
  status?: string;
}

export interface ApiResponse<T> {
  data: T
  message?: string
  status: string
  meta?: {
    current_page: number
    last_page: number
    per_page: number
    total: number
  }
}

export const fetchResource = async <T>(
  resource: string, 
  params: QueryParams = {}
)
: Promise<ApiResponse<T>> =>
{
  const { page = 1, per_page = 10, sort_by, sort_order, filters, search } = params

  const queryParams = {
    search,
    page,
    per_page,
    ...(sort_by && { sort_by }),
    ...(sort_order && { sort_order }),
    ...filters,
  }

  const response = await api.get(`/${resource}`, { params: queryParams })
  return response.data;
}

export const fetchResourceById = async <T>(
  resource: string,
  id: string | number
)
: Promise<T> =>
{
  try {
    console.log(`Fetching resource: ${resource}/${id}`);
    const response = await api.get(`/${resource}/${id}`);
    console.log(`API response for ${resource}/${id}:`, response.data);
    
    // Make sure we're returning the data property of the response
    if (response.data && response.data.data) {
      return response.data.data;
    }
    
    // If the response doesn't have a data property, return the whole response data
    return response.data;
  } catch (error) {
    console.error(`Error fetching ${resource}/${id}:`, error);
    throw error;
  }
}

export const createResource = async <T>(endpoint: string, data: any): Promise<ApiResponse<T>> => {
  const response = await api.post(endpoint, data)
  return response.data
}

export const updateResource = async <T>(endpoint: string, data: any, method: 'PUT' | 'PATCH' = 'PUT'): Promise<ApiResponse<T>> => {
  const response = method === 'PUT' ? 
    await api.put(endpoint, data) : 
    await api.patch(endpoint, data)
  return response.data
}

export const deleteResource = async (resource: string): Promise<void> => {
  await api.delete(resource)
}

export const performResourceAction = async <T, R = T>(
  resource: string,
  id: string | number,
  action: string,
  data?: any,
): Promise<ApiResponse<R>> => {
  const response = await api.post(`/${resource}/${id}/${action}`, data)
  return response.data
}
