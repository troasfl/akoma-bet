-- Create automation_status table
CREATE TABLE IF NOT EXISTS automation_status (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL CHECK (status IN ('active', 'paused', 'stopped')),
    last_changed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reason TEXT,
    can_start BOOLEAN DEFAULT TRUE,
    can_pause BOOLEAN DEFAULT TRUE,
    can_stop BOOLEAN DEFAULT TRUE,
    is_emergency_stopped BOOLEAN DEFAULT FALSE,
    emergency_stop_reason TEXT,
    emergency_stop_timestamp TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one status per user
    UNIQUE(user_id)
);

-- Create activities table
CREATE TABLE IF NOT EXISTS activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL CHECK (type IN (
        'bet_placed', 'bet_won', 'bet_lost', 'automation_started', 
        'automation_stopped', 'automation_paused', 'emergency_stop',
        'credential_added', 'credential_updated', 'credential_deleted', 'balance_updated'
    )),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount DECIMAL(15,2),
    currency VARCHAR(3) DEFAULT 'GHS',
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(20) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create emergency_stops table for audit logging
CREATE TABLE IF NOT EXISTS emergency_stops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reason TEXT,
    immediate BOOLEAN DEFAULT TRUE,
    notify_user BOOLEAN DEFAULT TRUE,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create dashboard_settings table
CREATE TABLE IF NOT EXISTS dashboard_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    refresh_interval INTEGER DEFAULT 30, -- seconds
    show_notifications BOOLEAN DEFAULT TRUE,
    auto_refresh_balance BOOLEAN DEFAULT TRUE,
    theme VARCHAR(10) DEFAULT 'system' CHECK (theme IN ('light', 'dark', 'system')),
    language VARCHAR(10) DEFAULT 'en',
    currency VARCHAR(3) DEFAULT 'GHS',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one settings per user
    UNIQUE(user_id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_activities_user_id ON activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_timestamp ON activities(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_activities_type ON activities(type);
CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
CREATE INDEX IF NOT EXISTS idx_emergency_stops_user_id ON emergency_stops(user_id);
CREATE INDEX IF NOT EXISTS idx_emergency_stops_created_at ON emergency_stops(created_at DESC);

-- Enable Row Level Security
ALTER TABLE automation_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE emergency_stops ENABLE ROW LEVEL SECURITY;
ALTER TABLE dashboard_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Automation status policies
CREATE POLICY "Users can view their own automation status" ON automation_status
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own automation status" ON automation_status
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own automation status" ON automation_status
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Activities policies
CREATE POLICY "Users can view their own activities" ON activities
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own activities" ON activities
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert activities for users" ON activities
    FOR INSERT WITH CHECK (true);

-- Emergency stops policies
CREATE POLICY "Users can view their own emergency stops" ON emergency_stops
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own emergency stops" ON emergency_stops
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert emergency stops for users" ON emergency_stops
    FOR INSERT WITH CHECK (true);

-- Dashboard settings policies
CREATE POLICY "Users can view their own dashboard settings" ON dashboard_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own dashboard settings" ON dashboard_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own dashboard settings" ON dashboard_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create functions for automation status management
CREATE OR REPLACE FUNCTION update_automation_status(
    p_user_id UUID,
    p_status VARCHAR(20),
    p_reason TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    INSERT INTO automation_status (user_id, status, reason, last_changed)
    VALUES (p_user_id, p_status, p_reason, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        status = EXCLUDED.status,
        reason = EXCLUDED.reason,
        last_changed = NOW(),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function for emergency stop
CREATE OR REPLACE FUNCTION emergency_stop_automation(
    p_user_id UUID,
    p_reason TEXT DEFAULT NULL,
    p_immediate BOOLEAN DEFAULT TRUE
)
RETURNS void AS $$
BEGIN
    -- Update automation status
    UPDATE automation_status 
    SET 
        status = 'stopped',
        is_emergency_stopped = TRUE,
        emergency_stop_reason = p_reason,
        emergency_stop_timestamp = NOW(),
        last_changed = NOW(),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Log emergency stop
    INSERT INTO emergency_stops (user_id, reason, immediate)
    VALUES (p_user_id, p_reason, p_immediate);
    
    -- Add activity record
    INSERT INTO activities (user_id, type, title, description, status, metadata)
    VALUES (
        p_user_id, 
        'emergency_stop', 
        'Emergency Stop Activated', 
        COALESCE(p_reason, 'Emergency stop activated by user'),
        'completed',
        jsonb_build_object('immediate', p_immediate, 'reason', p_reason)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log activities
CREATE OR REPLACE FUNCTION log_activity(
    p_user_id UUID,
    p_type VARCHAR(50),
    p_title VARCHAR(255),
    p_description TEXT DEFAULT NULL,
    p_amount DECIMAL(15,2) DEFAULT NULL,
    p_currency VARCHAR(3) DEFAULT 'GHS',
    p_metadata JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    INSERT INTO activities (
        user_id, type, title, description, amount, currency, metadata
    ) VALUES (
        p_user_id, p_type, p_title, p_description, p_amount, p_currency, p_metadata
    ) RETURNING id INTO v_activity_id;
    
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_automation_status_updated_at
    BEFORE UPDATE ON automation_status
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dashboard_settings_updated_at
    BEFORE UPDATE ON dashboard_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default dashboard settings for existing users
INSERT INTO dashboard_settings (user_id)
SELECT id FROM auth.users
ON CONFLICT (user_id) DO NOTHING;
