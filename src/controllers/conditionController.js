const conditionService = require('../services/conditionService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

function validateConditionType(conditionType) {
  if (
    conditionType &&
    !conditionService.ALLOWED_CONDITION_TYPES.has(conditionType)
  ) {
    throw createHttpError(
      400,
      'condition_type must be one of missing_document, data_issue, verification_required.'
    );
  }
}

async function createCondition(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const { title, description, assigned_to, condition_type, related_key } = req.body || {};

    if (!title || typeof title !== 'string') {
      throw createHttpError(400, 'title is required.');
    }

    if (description !== undefined && typeof description !== 'string') {
      throw createHttpError(400, 'description must be a string.');
    }

    if (assigned_to !== undefined && assigned_to !== null && typeof assigned_to !== 'string') {
      throw createHttpError(400, 'assigned_to must be a UUID string.');
    }

    if (related_key !== undefined && related_key !== null && typeof related_key !== 'string') {
      throw createHttpError(400, 'related_key must be a string when provided.');
    }

    validateConditionType(condition_type);

    const condition = await conditionService.createCondition(applicationId, {
      title,
      description,
      assigned_to,
      condition_type,
      related_key
    });

    res.status(201).json(condition);
  } catch (error) {
    if (error.code === '23503') {
      next(createHttpError(404, 'Application not found.'));
      return;
    }
    next(error);
  }
}

async function getConditions(req, res, next) {
  try {
    const { id: applicationId } = req.params;
    const conditions = await conditionService.getConditionsByApplication(applicationId);
    res.status(200).json(conditions);
  } catch (error) {
    next(error);
  }
}

async function updateCondition(req, res, next) {
  try {
    const { id: conditionId } = req.params;
    const { status, title, description, assigned_to, condition_type, related_key } = req.body || {};
    const hasAnyField =
      status !== undefined ||
      title !== undefined ||
      description !== undefined ||
      assigned_to !== undefined ||
      condition_type !== undefined ||
      related_key !== undefined;

    if (!hasAnyField) {
      throw createHttpError(400, 'At least one updatable field is required.');
    }

    if (status !== undefined && !['open', 'resolved'].includes(status)) {
      throw createHttpError(400, 'status must be open or resolved.');
    }

    if (title !== undefined && typeof title !== 'string') {
      throw createHttpError(400, 'title must be a string.');
    }

    if (description !== undefined && typeof description !== 'string') {
      throw createHttpError(400, 'description must be a string.');
    }

    if (assigned_to !== undefined && assigned_to !== null && typeof assigned_to !== 'string') {
      throw createHttpError(400, 'assigned_to must be a UUID string.');
    }

    if (related_key !== undefined && related_key !== null && typeof related_key !== 'string') {
      throw createHttpError(400, 'related_key must be a string when provided.');
    }

    validateConditionType(condition_type);

    const updatedCondition = await conditionService.updateCondition(conditionId, {
      status,
      title,
      description,
      assigned_to,
      condition_type,
      related_key
    });

    if (!updatedCondition) {
      throw createHttpError(404, 'Condition not found.');
    }

    res.status(200).json(updatedCondition);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createCondition,
  getConditions,
  updateCondition
};
