
-- Create a bucket for resume storage if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('resumes', 'Resume Files', false, 10485760, '{application/pdf}')
ON CONFLICT (id) DO NOTHING;

-- Set up security policies for the resumes bucket
-- Allow anonymous uploads (since we're not requiring auth for this demo)
CREATE POLICY "Anyone can upload resumes"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'resumes');

-- Allow anonymous downloads (since we're not requiring auth for this demo)
CREATE POLICY "Anyone can download resumes"
ON storage.objects FOR SELECT
USING (bucket_id = 'resumes');
