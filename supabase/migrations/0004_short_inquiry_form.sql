-- The contact form now asks only for name, email, phone/WhatsApp and a message.
-- Company, quantity and incoterm were already optional; country was required.
alter table public.inquiries alter column country drop not null;
