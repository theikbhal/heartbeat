const SibApiV3Sdk = require('@getbrevo/brevo');
require('dotenv').config();

// Set up the API client
const apiInstance = new SibApiV3Sdk.AccountApi();
apiInstance.setApiKey(SibApiV3Sdk.AccountApiApiKeys.apiKey, process.env.BREVO_API_KEY || 'YOUR_API_V3_KEY');

// Test the connection by fetching account details
apiInstance.getAccount()
  .then((data) => {
    console.log('API connection successful! Account info:', data);
  })
  .catch((error) => {
    console.error('API connection failed:', error.response ? error.response.body : error);
  });