import { create } from 'zustand';
import { supabase } from '../utils/supabase';
import { encryptionService } from '../services/encryptionService';
import { credentialValidationService } from '../services/credentialValidationService';
import { emailNotificationService } from '../services/emailNotificationService';
import { 
  UserCredentials, 
  CredentialStatus, 
  CredentialInput, 
  CredentialUpdate,
  CredentialValidationResult
} from '../types/credentials';

interface CredentialState {
  credentials: UserCredentials | null;
  status: CredentialStatus;
  loading: boolean;
  error: string | null;
  isValidating: boolean;
}

interface CredentialStore extends CredentialState {
  // CRUD Operations
  addCredentials: (input: CredentialInput, masterKey: string) => Promise<void>;
  updateCredentials: (update: CredentialUpdate, masterKey: string) => Promise<void>;
  deleteCredentials: () => Promise<void>;
  loadCredentials: () => Promise<void>;
  
  // Validation
  validateCredentials: (masterKey: string) => Promise<CredentialValidationResult>;
  
  // Status Management
  getCredentialStatus: () => Promise<CredentialStatus>;
  refreshStatus: () => Promise<void>;
  
  // Utility
  clearError: () => void;
  reset: () => void;
}

// Error handling utility
const handleCredentialError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'An unexpected error occurred';
};

export const useCredentialStore = create<CredentialStore>((set, get) => ({
  credentials: null,
  status: {
    hasCredentials: false,
    isValidated: false,
    lastValidationAt: null,
    isAutomationEnabled: false
  },
  loading: false,
  error: null,
  isValidating: false,

  addCredentials: async (input: CredentialInput, masterKey: string) => {
    try {
      set({ loading: true, error: null });

      // Validate master key
      if (!encryptionService.validateMasterKey(masterKey)) {
        throw new Error('Invalid master key');
      }

      // Encrypt password
      const encryptedPassword = encryptionService.encryptCredentials(input.password, masterKey);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Insert credentials into database
      const { data, error } = await supabase
        .from('user_credentials')
        .insert({
          user_id: user.id,
          username: input.username,
          encrypted_password: encryptedPassword.encrypted,
          iv: encryptedPassword.iv,
          salt: encryptedPassword.salt,
          is_validated: false
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      const credentials: UserCredentials = {
        id: data.id,
        userId: data.user_id,
        username: data.username,
        encryptedPassword: data.encrypted_password,
        iv: data.iv,
        salt: data.salt,
        isValidated: data.is_validated,
        lastValidationAt: data.last_validation_at ? new Date(data.last_validation_at) : null,
        createdAt: new Date(data.created_at),
        updatedAt: new Date(data.updated_at)
      };

      set({ 
        credentials,
        status: {
          hasCredentials: true,
          isValidated: false,
          lastValidationAt: null,
          isAutomationEnabled: false
        },
        loading: false 
      });

      // Send email notification
      await emailNotificationService.sendCredentialNotification({
        type: 'credentials_added',
        userId: user.id,
        timestamp: new Date()
      }, credentials);

    } catch (error) {
      set({ error: handleCredentialError(error), loading: false });
    }
  },

  updateCredentials: async (update: CredentialUpdate, masterKey: string) => {
    try {
      set({ loading: true, error: null });

      const { credentials } = get();
      if (!credentials) {
        throw new Error('No credentials to update');
      }

      // Validate master key
      if (!encryptionService.validateMasterKey(masterKey)) {
        throw new Error('Invalid master key');
      }

      const updateData: any = {};

      // Handle username update
      if (update.username) {
        updateData.username = update.username;
      }

      // Handle password update
      if (update.password) {
        const encryptedPassword = encryptionService.encryptCredentials(update.password, masterKey);
        updateData.encrypted_password = encryptedPassword.encrypted;
        updateData.iv = encryptedPassword.iv;
        updateData.salt = encryptedPassword.salt;
        updateData.is_validated = false; // Reset validation when password changes
      }

      // Update in database
      const { data, error } = await supabase
        .from('user_credentials')
        .update(updateData)
        .eq('id', credentials.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local state
      const updatedCredentials: UserCredentials = {
        ...credentials,
        username: data.username,
        encryptedPassword: data.encrypted_password,
        iv: data.iv,
        salt: data.salt,
        isValidated: data.is_validated,
        lastValidationAt: data.last_validation_at ? new Date(data.last_validation_at) : null,
        updatedAt: new Date(data.updated_at)
      };

      set({ 
        credentials: updatedCredentials,
        status: {
          ...get().status,
          isValidated: data.is_validated,
          lastValidationAt: data.last_validation_at ? new Date(data.last_validation_at) : null,
          isAutomationEnabled: data.is_validated
        },
        loading: false 
      });

      // Send email notification
      await emailNotificationService.sendCredentialNotification({
        type: 'credentials_updated',
        userId: credentials.userId,
        timestamp: new Date()
      }, updatedCredentials);

    } catch (error) {
      set({ error: handleCredentialError(error), loading: false });
    }
  },

  deleteCredentials: async () => {
    try {
      set({ loading: true, error: null });

      const { credentials } = get();
      if (!credentials) {
        throw new Error('No credentials to delete');
      }

      // Delete from database
      const { error } = await supabase
        .from('user_credentials')
        .delete()
        .eq('id', credentials.id);

      if (error) {
        throw error;
      }

      // Reset local state
      set({ 
        credentials: null,
        status: {
          hasCredentials: false,
          isValidated: false,
          lastValidationAt: null,
          isAutomationEnabled: false
        },
        loading: false 
      });

      // Send email notification
      await emailNotificationService.sendCredentialNotification({
        type: 'credentials_deleted',
        userId: credentials.userId,
        timestamp: new Date()
      });

    } catch (error) {
      set({ error: handleCredentialError(error), loading: false });
    }
  },

  loadCredentials: async () => {
    try {
      set({ loading: true, error: null });

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Load credentials from database
      const { data, error } = await supabase
        .from('user_credentials')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        const credentials: UserCredentials = {
          id: data.id,
          userId: data.user_id,
          username: data.username,
          encryptedPassword: data.encrypted_password,
          iv: data.iv,
          salt: data.salt,
          isValidated: data.is_validated,
          lastValidationAt: data.last_validation_at ? new Date(data.last_validation_at) : null,
          createdAt: new Date(data.created_at),
          updatedAt: new Date(data.updated_at)
        };

        set({ 
          credentials,
          status: {
            hasCredentials: true,
            isValidated: data.is_validated,
            lastValidationAt: data.last_validation_at ? new Date(data.last_validation_at) : null,
            isAutomationEnabled: data.is_validated
          },
          loading: false 
        });
      } else {
        set({ 
          credentials: null,
          status: {
            hasCredentials: false,
            isValidated: false,
            lastValidationAt: null,
            isAutomationEnabled: false
          },
          loading: false 
        });
      }

    } catch (error) {
      set({ error: handleCredentialError(error), loading: false });
    }
  },

  validateCredentials: async (masterKey: string): Promise<CredentialValidationResult> => {
    try {
      set({ isValidating: true, error: null });

      const { credentials } = get();
      if (!credentials) {
        throw new Error('No credentials to validate');
      }

      // Validate master key
      if (!encryptionService.validateMasterKey(masterKey)) {
        throw new Error('Invalid master key');
      }

      // Decrypt password
      const decryptedPassword = encryptionService.decryptCredentials(
        { encrypted: credentials.encryptedPassword, iv: credentials.iv, salt: credentials.salt },
        masterKey
      );

      // Create credential input for validation
      const credentialInput: CredentialInput = {
        username: credentials.username,
        password: decryptedPassword
      };

      // Perform validation
      const result = await credentialValidationService.validateCredentials(credentialInput);

      // Update validation status in database if successful
      if (result.isValid) {
        const { error } = await supabase
          .from('user_credentials')
          .update({
            is_validated: true,
            last_validation_at: new Date().toISOString()
          })
          .eq('id', credentials.id);

        if (error) {
          throw error;
        }

        // Update local state
        const updatedCredentials = {
          ...credentials,
          isValidated: true,
          lastValidationAt: new Date()
        };

        set({ 
          credentials: updatedCredentials,
          status: {
            hasCredentials: true,
            isValidated: true,
            lastValidationAt: new Date(),
            isAutomationEnabled: true
          }
        });

        // Send success notification
        await emailNotificationService.sendCredentialNotification({
          type: 'validation_success',
          userId: credentials.userId,
          timestamp: new Date(),
          metadata: { validationTime: result.validationTime }
        }, updatedCredentials, get().status);
      } else {
        // Send failure notification
        await emailNotificationService.sendCredentialNotification({
          type: 'validation_failed',
          userId: credentials.userId,
          timestamp: new Date(),
          metadata: { error: result.error }
        }, credentials, get().status);
      }

      set({ isValidating: false });
      return result;

    } catch (error) {
      set({ error: handleCredentialError(error), isValidating: false });
      return {
        isValid: false,
        error: handleCredentialError(error),
        validationTime: 0
      };
    }
  },

  getCredentialStatus: async (): Promise<CredentialStatus> => {
    const { status } = get();
    return status;
  },

  refreshStatus: async () => {
    await get().loadCredentials();
  },

  clearError: () => {
    set({ error: null });
  },

  reset: () => {
    set({
      credentials: null,
      status: {
        hasCredentials: false,
        isValidated: false,
        lastValidationAt: null,
        isAutomationEnabled: false
      },
      loading: false,
      error: null,
      isValidating: false
    });
  }
}));
