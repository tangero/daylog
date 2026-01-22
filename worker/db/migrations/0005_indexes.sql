-- Indexy pro vazební tabulky (kritické pro JOIN operace)
CREATE INDEX IF NOT EXISTS idx_entry_tags_entry ON entry_tags(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_tags_tag ON entry_tags(tag_id);
CREATE INDEX IF NOT EXISTS idx_entry_clients_entry ON entry_clients(entry_id);
CREATE INDEX IF NOT EXISTS idx_entry_clients_client ON entry_clients(client_id);

-- Kompozitní indexy pro časté vyhledávání podle jména
CREATE INDEX IF NOT EXISTS idx_tags_user_name ON tags(user_id, name);
CREATE INDEX IF NOT EXISTS idx_clients_user_name ON clients(user_id, name);
