
-- Create the email queue
SELECT pgmq.create('email_queue');

-- Create RPC wrapper to enqueue emails
CREATE OR REPLACE FUNCTION public.enqueue_email(payload jsonb)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  msg_id bigint;
BEGIN
  SELECT pgmq.send('email_queue', payload) INTO msg_id;
  RETURN msg_id;
END;
$$;

-- Create RPC wrapper to dequeue emails (used by cron/edge function)
CREATE OR REPLACE FUNCTION public.dequeue_emails(batch_size integer DEFAULT 10)
RETURNS SETOF pgmq.message_record
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY SELECT * FROM pgmq.read('email_queue', 30, batch_size);
END;
$$;

-- Create RPC wrapper to delete processed messages
CREATE OR REPLACE FUNCTION public.delete_email_message(msg_id bigint)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN pgmq.delete('email_queue', msg_id);
END;
$$;
