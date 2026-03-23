const { supabase } = require('../config/supabase');

async function getFieldsByProductAndGroup(product, groupName) {
  const { data, error } = await supabase
    .from('field_registry')
    .select(
      'key, label, type, required, repeatable, conditional_trigger, order_index'
    )
    .contains('product', [product])
    .eq('group_name', groupName)
    .order('order_index', { ascending: true });

  if (error) {
    throw error;
  }

  return (data || []).map((field) => ({
    key: field.key,
    label: field.label,
    type: field.type,
    required: field.required,
    repeatable: field.repeatable,
    conditional: field.conditional_trigger || null
  }));
}

module.exports = {
  getFieldsByProductAndGroup
};
