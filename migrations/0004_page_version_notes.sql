-- An optional note saved with each publish ("New hero photo", "Prices for 2027"…), shown in the history.
alter table page_versions add column note text not null default '';
