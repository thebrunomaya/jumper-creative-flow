-- Create a function to manually set user role (admin only)
CREATE OR REPLACE FUNCTION public.set_user_role(_user_email text, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    _user_id uuid;
BEGIN
    -- Find user by email
    SELECT id INTO _user_id
    FROM auth.users
    WHERE email = _user_email;
    
    IF _user_id IS NULL THEN
        RETURN false; -- User not found
    END IF;
    
    -- Remove existing role for this user
    DELETE FROM public.j_ads_user_roles 
    WHERE user_id = _user_id;
    
    -- Insert new role
    INSERT INTO public.j_ads_user_roles (user_id, role)
    VALUES (_user_id, _role);
    
    RETURN true;
END;
$$;