SELECT cron.schedule(
  'process-email-queue',
  '* * * * *',
  $$
  SELECT net.http_post(
    url := 'https://raxgcndwtqphoxoagthf.supabase.co/functions/v1/send-transactional-email',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJheGdjbmR3dHFwaG94b2FndGhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQwNzAyOTgsImV4cCI6MjA2OTY0NjI5OH0.KTapRHzfDJr3kz2GKIj5U4XlAUUM3_V4mN0aOhO6yug"}'::jsonb,
    body := '{"process": true}'::jsonb
  ) AS request_id;
  $$
)