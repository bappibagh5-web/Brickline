const fieldService = require('../services/fieldService');

function createHttpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function getFields(req, res, next) {
  try {
    const { product, group: groupName } = req.query;

    if (!product) {
      throw createHttpError(400, 'product query parameter is required.');
    }

    if (!groupName) {
      throw createHttpError(400, 'group query parameter is required.');
    }

    const fields = await fieldService.getFieldsByProductAndGroup(product, groupName);
    res.status(200).json(fields);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getFields
};
