-- Create user_credentials table for storing encrypted msport.com credentials
CREATE TABLE IF NOT EXISTS user_credentials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    encrypted_password TEXT NOT NULL,
    iv TEXT NOT NULL, -- Initialization vector for AES encryption
    salt TEXT NOT NULL, -- Salt for key derivation
    is_validated BOOLEAN DEFAULT FALSE,
    last_validation_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one credential set per user
    UNIQUE(user_id)
);

-- Create credential_audit_log table for tracking credential changes
CREATE TABLE IF NOT EXISTS credential_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'VALIDATE')),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    
    -- Index for efficient querying
    INDEX idx_credential_audit_user_id (user_id),
    INDEX idx_credential_audit_timestamp (timestamp)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_credentials_user_id ON user_credentials(user_id);
CREATE INDEX IF NOT EXISTS idx_user_credentials_validation ON user_credentials(is_validated, last_validation_at);

-- Enable Row Level Security
ALTER TABLE user_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE credential_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_credentials
-- Users can only access their own credentials
CREATE POLICY "Users can view their own credentials" ON user_credentials
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own credentials" ON user_credentials
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own credentials" ON user_credentials
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own credentials" ON user_credentials
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for credential_audit_log
-- Users can only view their own audit logs
CREATE POLICY "Users can view their own audit logs" ON credential_audit_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert audit logs" ON credential_audit_log
    FOR INSERT WITH CHECK (true);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on user_credentials
CREATE TRIGGER update_user_credentials_updated_at
    BEFORE UPDATE ON user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log credential changes
CREATE OR REPLACE FUNCTION log_credential_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Log the change to audit table
    INSERT INTO credential_audit_log (
        user_id,
        action,
        success,
        error_message
    ) VALUES (
        COALESCE(NEW.user_id, OLD.user_id),
        CASE
            WHEN TG_OP = 'INSERT' THEN 'CREATE'
            WHEN TG_OP = 'UPDATE' THEN 'UPDATE'
            WHEN TG_OP = 'DELETE' THEN 'DELETE'
        END,
        TRUE,
        NULL
    );
    
    RETURN COALESCE(NEW, OLD);
END;
$$ language 'plpgsql';

-- Trigger to log credential changes
CREATE TRIGGER log_user_credentials_changes
    AFTER INSERT OR UPDATE OR DELETE ON user_credentials
    FOR EACH ROW
    EXECUTE FUNCTION log_credential_change();

-- Function to validate credentials (placeholder for future implementation)
CREATE OR REPLACE FUNCTION validate_user_credentials(credential_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- This will be implemented with Playwright integration
    -- For now, just update the validation timestamp
    UPDATE user_credentials 
    SET is_validated = TRUE, last_validation_at = NOW()
    WHERE id = credential_id AND user_id = auth.uid();
    
    RETURN FOUND;
END;
$$ language 'plpgsql';

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON user_credentials TO authenticated;
GRANT ALL ON credential_audit_log TO authenticated;
GRANT USAGE ON SEQUENCE credential_audit_log_id_seq TO authenticated;
