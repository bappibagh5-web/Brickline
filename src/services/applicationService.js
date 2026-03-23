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

module.exports = {
  createApplication,
  getApplicationById,
  mergeApplicationData
};
