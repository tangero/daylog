-- Hodinová sazba pro klienty
ALTER TABLE clients ADD COLUMN hourly_rate INTEGER DEFAULT NULL;
