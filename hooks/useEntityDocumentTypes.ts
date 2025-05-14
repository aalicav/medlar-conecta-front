import { useQuery } from '@tanstack/react-query';
import api from '@/services/api-client';

export interface EntityDocumentType {
  id: number;
  entity_type: string;
  name: string;
  code: string;
  description: string | null;
  is_required: boolean;
  is_active: boolean;
  expiration_alert_days: number | null;
  created_at: string;
  updated_at: string;
}

export function useEntityDocumentTypes(entityType: string) {
  return useQuery<EntityDocumentType[]>({
    queryKey: ['entity-document-types', entityType],
    queryFn: async () => {
      const { data } = await api.get(`/entity-document-types`, {
        params: {
          entity_type: entityType,
          is_active: true
        }
      });
      return data;
    }
  });
} 