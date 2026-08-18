import { adminRepository } from '../repositories/admin.repository.js';

export class AdminService {
  async getMetrics() {
    return adminRepository.getSystemMetrics();
  }

  async getAllReports(statusFilter?: string) {
    return adminRepository.getAllReports(statusFilter);
  }

  async moderateReport(reportId: string, action: 'approve' | 'dismiss' | 'delete') {
    if (!['approve', 'dismiss', 'delete'].includes(action)) {
      throw new Error('Invalid moderation action. Allowed: approve, dismiss, delete');
    }
    return adminRepository.moderateReport(reportId, action);
  }

  async getAllUsers() {
    return adminRepository.getAllUsers();
  }

  async setAdminStatus(userId: string, isAdmin: boolean) {
    return adminRepository.setAdminStatus(userId, isAdmin);
  }
}

export const adminService = new AdminService();
