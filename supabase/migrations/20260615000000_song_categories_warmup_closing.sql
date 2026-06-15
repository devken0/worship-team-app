-- Add two service-flow song categories. Existing: welcoming, praise, worship.
-- Resulting sort order: warm_up, welcoming, praise, worship, closing.
alter type song_category add value if not exists 'warm_up' before 'welcoming';
alter type song_category add value if not exists 'closing' after 'worship';
