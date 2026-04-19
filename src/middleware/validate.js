const Ajv = require("ajv");
const addFormats = require("ajv-formats");
const ajv = new Ajv();
addFormats(ajv);

const validateSchema = (schema) => {
  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const isValid = validate(req.body);
    if (!isValid) {
      return res.status(400).json({
        status: "fail",
        message: "Validation Error",
        errors: validate.errors.map((err) => ({
          field: err.instancePath.replace("/", ""),
          message: err.message,
        })),
      });
    }
    next();
  };
};

module.exports = validateSchema;
