-- Helper production logic:
-- Deduct raw materials according to recipe and increment produced goods quantity.
create or replace function produce_goods_from_raw(
  p_good_id bigint,
  p_units numeric
) returns void as $$
declare
  v_recipe jsonb;
  v_raw record;
begin
  select recipe into v_recipe from produced_goods where id = p_good_id;
  if v_recipe is null then
    raise exception 'Recipe not found for produced_good %', p_good_id;
  end if;

  -- For each raw material SKU in the recipe, deduct required quantity
  for v_raw in
    select key as raw_sku, (value::numeric) * p_units as needed_qty
    from jsonb_each(v_recipe)
  loop
    update raw_materials
    set quantity = quantity - v_raw.needed_qty
    where sku = v_raw.raw_sku;
  end loop;

  update produced_goods
  set quantity = quantity + p_units
  where id = p_good_id;
end;
$$ language plpgsql;

-- POS sale: insert sale & decrement produced_goods (retail stock) atomically.
create or replace function record_sale_and_decrement_stock(
  p_item_id bigint,
  p_quantity numeric,
  p_payment_status text
) returns void as $$
begin
  insert into sales (item_id, quantity, payment_status)
  values (p_item_id, p_quantity, p_payment_status);

  update produced_goods
  set quantity = quantity - p_quantity
  where id = p_item_id;
end;
$$ language plpgsql;

-- Transfer Requests: enforce PENDING -> ADJUSTED -> APPROVED state machine
create or replace function validate_transfer_status()
returns trigger as $$
begin
  if new.status = old.status then
    return new;
  end if;

  if old.status = 'PENDING' then
    if new.status not in ('PENDING', 'ADJUSTED', 'APPROVED') then
      raise exception 'Invalid transfer status transition from % to %', old.status, new.status;
    end if;
  elsif old.status = 'ADJUSTED' then
    if new.status not in ('ADJUSTED', 'APPROVED') then
      raise exception 'Invalid transfer status transition from % to %', old.status, new.status;
    end if;
  elsif old.status = 'APPROVED' then
    if new.status <> 'APPROVED' then
      raise exception 'Cannot change status after APPROVED';
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_validate_transfer_status on transfer_requests;

create trigger trg_validate_transfer_status
before update on transfer_requests
for each row
execute procedure validate_transfer_status();

-- When a Procurement -> Manufacturing request is APPROVED,
-- decrement raw_materials based on approved_qty (fallback to requested_qty).
create or replace function apply_transfer_stock_effects()
returns trigger as $$
declare
  v_item jsonb;
  v_qty numeric;
begin
  if new.status = 'APPROVED' and old.status <> 'APPROVED' then
    if new.from_dept = 'PROCUREMENT' and new.to_dept = 'MANUFACTURING' then
      for v_item in select * from jsonb_array_elements(new.items)
      loop
        if (v_item ->> 'item_type') = 'RAW' then
          v_qty := coalesce(
            (v_item ->> 'approved_qty')::numeric,
            (v_item ->> 'requested_qty')::numeric,
            0
          );

          if v_qty > 0 then
            update raw_materials
            set quantity = quantity - v_qty
            where id = (v_item ->> 'item_id')::bigint;
          end if;
        end if;
      end loop;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_apply_transfer_stock_effects on transfer_requests;

create trigger trg_apply_transfer_stock_effects
after update on transfer_requests
for each row
execute procedure apply_transfer_stock_effects();


