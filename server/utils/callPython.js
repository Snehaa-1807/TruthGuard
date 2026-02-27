const axios = require("axios");

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:5001";

const mlClient = axios.create({
  baseURL: ML_SERVICE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

/**
 * Call the Python ML microservice for a prediction.
 * @param {string} text - Raw article text
 * @returns {Promise<Object>} Prediction result
 */
const callPredictService = async (text) => {
  const response = await mlClient.post("/predict", { text });
  return response.data;
};

/**
 * Fetch model metadata from the ML service.
 * @returns {Promise<Object>}
 */
const getModelInfo = async () => {
  const response = await mlClient.get("/model-info");
  return response.data;
};

/**
 * Health check the ML service.
 * @returns {Promise<boolean>}
 */
const checkMLHealth = async () => {
  try {
    const response = await mlClient.get("/health");
    return response.data.status === "ok" && response.data.model_loaded;
  } catch {
    return false;
  }
};

module.exports = { callPredictService, getModelInfo, checkMLHealth };
