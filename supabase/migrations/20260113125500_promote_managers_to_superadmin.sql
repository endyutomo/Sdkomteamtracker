-- Promote all existing users in the 'manager' division to have the 'superadmin' role
-- This ensures they have full authority across the system

INSERT INTO public.user_roles (user_id, role)
SELECT user_id, 'superadmin'::public.app_role
FROM public.profiles
WHERE division = 'manager'
ON CONFLICT (user_id, role) DO NOTHING;

-- Also update existing 'admin' roles to 'superadmin' if any (legacy check)
UPDATE public.user_roles
SET role = 'superadmin'
WHERE role = 'admin'::public.app_role;
