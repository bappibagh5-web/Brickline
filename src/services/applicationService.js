const { supabase } = require('../config/supabase');
const conditionService = require('./conditionService');

async function createApplication(userId) {
  const { data, error } = await supabase
    .from('loan_applications')
    .insert({
      user_id: userId,
      status: 'lead',
      application_data: {}
    })
    .select('*')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function startApplication() {
  const { data, error } = await supabase
    .from('loan_applications')
    .insert({
      user_id: null,
      status: 'lead',
      application_data: {}
    })
    .select('id, status, application_data, created_at, updated_at')
    .single();

  if (error) {
    throw error;
  }

  return data;
}

async function getApplicationById(applicationId) {
  const { data, error } = await supabase
    .from('loan_applications')
    .select('*')
    .eq('id', applicationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

async function insertStepCompletedEvent(applicationId, stepKey) {
  if (!stepKey) {
    return;
  }

  const withPreferredShape = await supabase
    .from('application_events')
    .insert({
      application_id: applicationId,
      event_type: 'step_completed',
      metadata: { step_key: stepKey }
    });

  if (!withPreferredShape.error) {
    return;
  }

  // Fallback for legacy schema without event_type/metadata columns.
  const fallback = await supabase
    .from('application_events')
    .insert({
      application_id: applicationId,
      notes: `step_completed:${stepKey}`
    });

  if (fallback.error) {
    throw fallback.error;
  }
}

async function mergeApplicationData(applicationId, newData) {
  const { data, error } = await supabase.rpc('merge_application_data', {
    p_application_id: applicationId,
    p_new_data: newData
  });

  if (error) {
    throw error;
  }

  if (!data || data.length === 0) {
    return null;
  }

  await conditionService.resolveRelatedConditions(applicationId, newData);

  return data[0];
}

async function saveApplicationStep(applicationId, stepKey, stepData) {
  const merged = await mergeApplicationData(applicationId, stepData);

  if (!merged) {
    return null;
  }

  await insertStepCompletedEvent(applicationId, stepKey);

  return merged;
}

async function attachUserToApplication(applicationId, userId) {
  const { data, error } = await supabase
    .from('loan_applications')
    .update({
      user_id: userId,
      status: 'account_created',
      updated_at: new Date().toISOString()
    })
    .eq('id', applicationId)
    .select('*')
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data;
}

const FALLBACK_STEP_ORDER = [
  'loan_program',
  'experience',
  'property_state',
  'has_entity',
  'email',
  'phone',
  'name'
];

function parseEventStep(event) {
  if (!event) return null;

  if (event.metadata && typeof event.metadata === 'object' && event.metadata.step_key) {
    return event.metadata.step_key;
  }

  if (typeof event.notes === 'string' && event.notes.startsWith('step_completed:')) {
    return event.notes.slice('step_completed:'.length);
  }

  return null;
}

function deriveLastStepFromData(applicationData) {
  const data = applicationData && typeof applicationData === 'object' ? applicationData : {};

  let lastStep = null;
  for (const key of FALLBACK_STEP_ORDER) {
    const value = data[key];
    if (value === null || value === undefined || value === '') {
      continue;
    }
    lastStep = key;
  }

  return lastStep;
}

async function getApplicationResume(applicationId) {
  const application = await getApplicationById(applicationId);

  if (!application) {
    return null;
  }

  const eventsResponse = await supabase
    .from('application_events')
    .select('metadata, notes, created_at')
    .eq('application_id', applicationId)
    .order('created_at', { ascending: false })
    .limit(1);

  if (eventsResponse.error) {
    throw eventsResponse.error;
  }

  const latestEvent = eventsResponse.data && eventsResponse.data.length > 0
    ? eventsResponse.data[0]
    : null;

  const lastStepFromEvent = parseEventStep(latestEvent);
  const lastStep = lastStepFromEvent || deriveLastStepFromData(application.application_data);

  return {
    last_step: lastStep,
    data: application.application_data || {}
  };
}

module.exports = {
  createApplication,
  startApplication,
  getApplicationById,
  mergeApplicationData,
  saveApplicationStep,
  attachUserToApplication,
  getApplicationResume
};
