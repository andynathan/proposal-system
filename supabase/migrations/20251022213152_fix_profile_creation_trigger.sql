/*
  # Fix Profile Creation Trigger

  ## Changes
  - Grant INSERT permission on profiles table to service role
  - Ensure the trigger function can insert profiles without RLS blocking it

  ## Security
  - The trigger is SECURITY DEFINER which means it runs with the privileges of the function owner
  - This allows it to bypass RLS and create the profile automatically
*/

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO service_role;
GRANT INSERT ON profiles TO service_role;

-- Recreate the function to ensure it has proper permissions
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    'admin'
  );
  RETURN NEW;
EXCEPTION
  WHEN unique_violation THEN
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();