export interface AdminUser {
  id: string;
  email: string;
  role: 'admin' | 'moderator' | 'viewer';
}
