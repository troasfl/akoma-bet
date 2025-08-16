-- Configure password policy (minimum 12 characters, mixed case, numbers, symbols)
UPDATE auth.config 
SET 
    password_min_length = 12,
    password_require_uppercase = true,
    password_require_lowercase = true,
    password_require_numbers = true,
    password_require_symbols = true;

-- Configure rate limiting for failed login attempts
UPDATE auth.config 
SET 
    max_failed_attempts = 5,
    lockout_duration = 300; -- 5 minutes

-- Configure email templates
UPDATE auth.config 
SET 
    mailer_autoconfirm = false,
    enable_signup = true,
    enable_confirmations = true;

-- Configure JWT settings
UPDATE auth.config 
SET 
    jwt_exp = 3600, -- 1 hour
    refresh_token_rotation_enabled = true,
    refresh_token_reuse_interval = 10; -- 10 seconds
