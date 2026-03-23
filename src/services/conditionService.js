const { supabase } = require('../config/supabase');

const ALLOWED_CONDITION_TYPES = new Set([
  'missing_document',
  'data_issue',
  'verification_required'
]);

function flattenObjectPaths(value, basePath = '') {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return basePath ? [basePath] : [];
  }

  const keys = Object.keys(value);
  if (keys.length === 0) {
    return basePath ? [basePath] : [];
  }

  return keys.flatMap((key) => {
    const nextPath = basePath ? `${basePath}.${key}` : key;
    return flattenObjectPaths(value[key], nextPath);
  });
}

async function createCondition(applicationId, payload) {
  const insertPayload = {
    application_id: applicationId,
    title: payload.title,
    description: payload.description || null,
    assigned_to: payload.assigned_to || null,
    status: 'open',
    condition_type: payload.condition_type || null,
    related_key: payload.related_key || null
  };

  const { data, error } = await supabase
    .from('conditions')
    .insert(insertPayload)
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getConditionsByApplication(applicationId) {
  const { data, error } = await supabase
    .from('conditions')
    .select('*')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

async function updateCondition(conditionId, payload) {
  const updates = {};

  if (typeof payload.status === 'string') updates.status = payload.status;
  if (typeof payload.title === 'string') updates.title = payload.title;
  if (typeof payload.description === 'string') updates.description = payload.description;
  if (payload.assigned_to !== undefined) updates.assigned_to = payload.assigned_to;
  if (payload.condition_type !== undefined) updates.condition_type = payload.condition_type;
  if (payload.related_key !== undefined) updates.related_key = payload.related_key;

  if (Object.keys(updates).length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from('conditions')
    .update(updates)
    .eq('id', conditionId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function resolveRelatedConditions(applicationId, newData) {
  const allPaths = flattenObjectPaths(newData);
  if (allPaths.length === 0) {
    return [];
  }

  const uniquePaths = Array.from(new Set(allPaths));

  const { data, error } = await supabase
    .from('conditions')
    .update({ status: 'resolved' })
    .eq('application_id', applicationId)
    .eq('status', 'open')
    .in('related_key', uniquePaths)
    .select('*');

  if (error) {
    throw error;
  }

  return data || [];
}

module.exports = {
  ALLOWED_CONDITION_TYPES,
  createCondition,
  getConditionsByApplication,
  updateCondition,
  resolveRelatedConditions
};
