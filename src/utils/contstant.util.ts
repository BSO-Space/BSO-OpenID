// Define Audit Actions
export const AUDIT_ACTIONS = {
    CREATE: 'CREATE',
    UPDATE: 'UPDATE',
    DELETE: 'DELETE',
    READ: 'READ',
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    REGISTER: 'REGISTER',
    FORGOT_PASSWORD: 'FORGOT_PASSWORD',
    RESET_PASSWORD: 'RESET_PASSWORD',
    VERIFY_EMAIL: 'VERIFY_EMAIL',
    RESEND_EMAIL_VERIFICATION: 'RESEND_EMAIL_VERIFICATION',
    CHANGE_PASSWORD: 'CHANGE_PASSWORD',
    CHANGE_EMAIL: 'CHANGE_EMAIL',
    CHANGE_USERNAME: 'CHANGE_USERNAME',
    CHANGE_ROLE: 'CHANGE_ROLE',
    CHANGE_PERMISSION: 'CHANGE_PERMISSION',
    CHANGE_AVATAR: 'CHANGE_AVATAR',
    CHANGE_PROFILE: 'CHANGE_PROFILE',
    CHANGE_SETTINGS: 'CHANGE_SETTINGS',
  } as const;
  
  // Audit Log Format Mapping
  export const AUDIT_LOG_FORMAT = (
    action: string,
    entity: string,
    details: Record<string, any> = {}
  ) => ({
    action,
    entity,
    details,
    timestamp: new Date().toISOString(),
  });
  
  // Generate Audit Log Utility
  export const generateAuditLog = (
    userId: string | null,
    action: keyof typeof AUDIT_ACTIONS,
    entity: string,
    details: Record<string, any> = {}
  ) => {
    const log = AUDIT_LOG_FORMAT(action, entity, details);
    return userId ? { userId, ...log } : log;
  };
  