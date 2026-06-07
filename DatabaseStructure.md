Enum product_type {
  LM
  BR
}

Enum transaction_status {
  PIUTANG
  LUNAS
}

Enum bonus_ledger_type {
  EARNED
  CONSUMED
}

Table users {
  id bigint [pk, increment]

  username varchar(100) [not null, unique]
  password_hash varchar(255) [not null]

  last_login_at datetime

  created_at datetime
  updated_at datetime
}

Table customers {
  id bigint [pk, increment]

  customer_code varchar(30) [unique]

  name varchar(200) [not null]

  bonus_threshold decimal(18,2) [not null]

  accumulated_bonus_omzet decimal(18,2) [default: 0]
  granted_bonus_count int [default: 0]

  is_deleted boolean [default: false]

  created_at datetime
  updated_at datetime
  deleted_at datetime

  indexes {
    customer_code [unique]
    name
  }
}

Table customer_discount_groups {
  id bigint [pk, increment]

  customer_id bigint [not null]

  product_type product_type [not null]

  created_at datetime

  indexes {
    customer_id
  }
}

Table customer_discount_details {
  id bigint [pk, increment]

  discount_group_id bigint [not null]

  sequence_no int [not null]

  discount_percent decimal(5,2) [not null]

  created_at datetime

  indexes {
    discount_group_id
  }
}

Table products {
  id bigint [pk, increment]

  product_code varchar(30) [unique]

  name varchar(200) [not null]

  product_type product_type [not null]

  cost_price decimal(18,2) [not null]

  base_price decimal(18,2) [not null]

  is_deleted boolean [default: false]

  created_at datetime
  updated_at datetime
  deleted_at datetime

  indexes {
    product_code [unique]
    product_type
    name
  }
}

Table transactions {
  id bigint [pk, increment]

  bon_number varchar(100) [not null, unique]

  customer_id bigint [not null]

  transaction_date date [not null]

  payment_date date

  description text

  shipping_cost decimal(18,2) [default: 0]

  is_bonus_transaction boolean [default: false]

  status transaction_status [default: 'PIUTANG']

  subtotal_omzet decimal(18,2) [default: 0]

  total_amount decimal(18,2) [default: 0]

  total_profit decimal(18,2) [default: 0]

  created_by bigint
  updated_by bigint

  created_at datetime
  updated_at datetime

  indexes {
    bon_number [unique]
    customer_id
    transaction_date
    status
  }
}

Table transaction_items {
  id bigint [pk, increment]

  transaction_id bigint [not null]

  product_id bigint [not null]

  product_name_snapshot varchar(200)

  product_type product_type

  quantity int [not null]

  base_price decimal(18,2)

  cost_price decimal(18,2)

  discount_percentage_effective decimal(8,4)

  discounted_unit_price decimal(18,2)

  line_omzet decimal(18,2)

  line_profit decimal(18,2)

  is_bonus_item boolean [default: false]

  created_at datetime

  indexes {
    transaction_id
    product_id
  }
}

Table transaction_item_discount_snapshots {
  id bigint [pk, increment]

  transaction_item_id bigint [not null]

  sequence_no int [not null]

  discount_percent decimal(5,2) [not null]

  indexes {
    transaction_item_id
  }
}

Table customer_bonus_ledgers {
  id bigint [pk, increment]

  customer_id bigint [not null]

  transaction_id bigint

  ledger_type bonus_ledger_type [not null]

  amount decimal(18,2) [not null]

  notes varchar(255)

  created_at datetime

  indexes {
    customer_id
    transaction_id
  }
}

Table bonus_redemptions {
  id bigint [pk, increment]

  customer_id bigint [not null]

  transaction_id bigint [not null]

  bonus_count int [not null]

  threshold_amount decimal(18,2) [not null]

  consumed_amount decimal(18,2) [not null]

  remaining_amount decimal(18,2)

  created_at datetime

  indexes {
    customer_id
    transaction_id
  }
}

Ref: customer_discount_groups.customer_id > customers.id

Ref: customer_discount_details.discount_group_id > customer_discount_groups.id

Ref: transactions.customer_id > customers.id

Ref: transactions.created_by > users.id
Ref: transactions.updated_by > users.id

Ref: transaction_items.transaction_id > transactions.id

Ref: transaction_items.product_id > products.id

Ref: transaction_item_discount_snapshots.transaction_item_id > transaction_items.id

Ref: customer_bonus_ledgers.customer_id > customers.id

Ref: customer_bonus_ledgers.transaction_id > transactions.id

Ref: bonus_redemptions.customer_id > customers.id

Ref: bonus_redemptions.transaction_id > transactions.id