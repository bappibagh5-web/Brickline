const applicationService = require('../services/applicationService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function createApplication(req, res, next) {
  try {
    const { user_id: userId } = req.body || {};

    if (!userId) {
      throw createHttpError(400, 'user_id is required.');
    }

    const application = await applicationService.createApplication(userId);
    res.status(201).json(application);
  } catch (error) {
    next(error);
  }
}

async function getApplication(req, res, next) {
  try {
    const { id } = req.params;
    const application = await applicationService.getApplicationById(id);

    if (!application) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json(application);
  } catch (error) {
    next(error);
  }
}

async function updateApplication(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const newData = body.new_data && typeof body.new_data === 'object'
      ? body.new_data
      : body;

    if (!newData || typeof newData !== 'object' || Array.isArray(newData)) {
      throw createHttpError(400, 'Request body must be a JSON object.');
    }

    if (Object.keys(newData).length === 0) {
      throw createHttpError(400, 'Update payload cannot be empty.');
    }

    const updatedApplication = await applicationService.mergeApplicationData(id, newData);

    if (!updatedApplication) {
      throw createHttpError(404, 'Application not found.');
    }

    res.status(200).json(updatedApplication);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createApplication,
  getApplication,
  updateApplication
};
