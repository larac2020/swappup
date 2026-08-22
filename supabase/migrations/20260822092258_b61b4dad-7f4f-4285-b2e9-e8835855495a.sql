UPDATE public.airline_change_fees
SET is_transferable = false,
    notes = 'Blocked on Swappup pending confirmation of Eurowings'' actual fare-eligibility rules. Name changes are handled via the call centre and no official published policy confirms which fare brands (e.g. Flex) permit passenger substitution. Re-enable only once an official source is verified.',
    confidence = 'low',
    updated_at = now()
WHERE lower(airline_code) = 'ew' OR lower(airline_name) LIKE '%eurowings%';