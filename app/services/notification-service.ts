import { apiClient } from './api-client';

interface NotificationData {
  title: string;
  body: string;
  action_link?: string;
  action_text?: string;
  icon?: string;
  priority?: 'normal' | 'high' | 'low';
}

/**
 * Service for handling notifications in the frontend
 */
class NotificationService {
  /**
   * Send a notification to a specific user
   */
  async sendToUser(userId: string, data: NotificationData): Promise<any> {
    try {
      const response = await apiClient.post('/notifications/user', {
        user_id: userId,
        ...data
      });
      return response.data;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      throw error;
    }
  }

  /**
   * Send a notification to all users with a specific role
   */
  async sendToRole(roleName: string, data: NotificationData, exceptUserId?: string): Promise<any> {
    try {
      const response = await apiClient.post('/notifications/role', {
        role: roleName,
        except_user_id: exceptUserId,
        ...data
      });
      return response.data;
    } catch (error) {
      console.error('Error sending notification to role:', error);
      throw error;
    }
  }

  /**
   * Get all notifications for the current user
   */
  async getNotifications(page = 1, limit = 10): Promise<any> {
    try {
      const response = await apiClient.get('/notifications', {
        params: { page, per_page: limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching notifications:', error);
      throw error;
    }
  }

  /**
   * Get unread notifications count for the current user
   */
  async getUnreadCount(): Promise<number> {
    try {
      const response = await apiClient.get('/notifications/unread/count');
      return response.data.count;
    } catch (error) {
      console.error('Error fetching unread notifications count:', error);
      return 0;
    }
  }

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId: string): Promise<any> {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Error marking notification as read:', error);
      throw error;
    }
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(): Promise<any> {
    try {
      const response = await apiClient.post('/notifications/read-all');
      return response.data;
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      throw error;
    }
  }
}

export const notificationService = new NotificationService(); 