# LLM Visibility Tracker - Cloud Function

A Google Cloud Run function that captures and stores prompt/response data from LLM interactions for brand visibility analysis and monitoring.

## Overview

This serverless function receives base64-encoded payload data from a browser extension or client tool, decodes it, and stores the conversation data in Google Cloud Storage for later analysis. It's designed to track how brands and entities are represented across different LLM outputs.

## Features

- **CORS-enabled**: Accepts cross-origin requests from browser extensions
- **Secure data handling**: Processes base64-encoded payloads
- **Automated storage**: Saves conversation data to GCS with timestamped filenames
- **Conversation tracking**: Organizes files by conversation ID
- **Error handling**: Robust error responses and logging

## Architecture

```
Browser Extension/Client
        ↓
    [POST Request]
        ↓
  Cloud Run Function
        ↓
  Google Cloud Storage
   (llm-visibility bucket)
```

## Prerequisites

- Google Cloud Platform account
- GCP project with billing enabled
- Google Cloud Storage bucket named `llm-visibility`
- Cloud Run API enabled
- Appropriate IAM permissions for Cloud Storage

## Deployment

### 1. Set up Google Cloud

```bash
# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Create the storage bucket (if not exists)
gsutil mb gs://llm-visibility

# Enable required APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable run.googleapis.com
```

### 2. Deploy the function

```bash
# Deploy to Cloud Run Functions (2nd gen)
gcloud functions deploy savePromptData \
  --gen2 \
  --runtime=nodejs20 \
  --region=YOUR_REGION \
  --source=. \
  --entry-point=savePromptData \
  --trigger-http \
  --allow-unauthenticated
```

Replace `YOUR_REGION` with your preferred region (e.g., `europe-west1`, `us-central1`).

### 3. Note the function URL

After deployment, the CLI will output a URL like:
```
https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/savePromptData
```

## API Reference

### Endpoint

```
POST /savePromptData
```

### Headers

```
Content-Type: application/json
```

### Request Body

```json
{
  "data": "base64_encoded_json_string"
}
```

The base64-encoded data should decode to a JSON object with at minimum:
- `conversation_id`: (optional) Identifier for the conversation
- Additional fields as needed for your LLM tracking

### Response

**Success (200)**
```json
{
  "success": true,
  "file": "prompt-data/conv123_2024-12-11T10-30-45-123Z.json"
}
```

**Error (400)**
```json
{
  "error": "No data provided"
}
```

**Error (500)**
```json
{
  "error": "Error message details"
}
```

## Storage Format

Files are stored in the `llm-visibility` bucket with the following structure:

```
llm-visibility/
└── prompt-data/
    ├── conv123_2024-12-11T10-30-45-123Z.json
    ├── conv456_2024-12-11T11-15-22-456Z.json
    └── ...
```

Each file contains the full decoded JSON payload with proper formatting (2-space indentation).

## Example Usage

### Using cURL

```bash
# Encode your JSON data
DATA=$(echo '{"conversation_id":"test123","prompt":"Hello","response":"Hi there"}' | base64)

# Send to function
curl -X POST https://YOUR_FUNCTION_URL/savePromptData \
  -H "Content-Type: application/json" \
  -d "{\"data\":\"$DATA\"}"
```

### Using JavaScript (Browser Extension)

```javascript
const payload = {
  conversation_id: 'abc123',
  prompt: 'What is the best smartphone?',
  response: 'The iPhone 15 Pro is highly rated...',
  timestamp: new Date().toISOString(),
  model: 'gpt-4'
};

const encoded = btoa(JSON.stringify(payload));

fetch('https://YOUR_FUNCTION_URL/savePromptData', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ data: encoded })
});
```

## Development

### Local Testing

```bash
# Install dependencies
npm install

# Use Functions Framework for local testing
npm install -g @google-cloud/functions-framework

# Run locally
functions-framework --target=savePromptData --port=8080
```

Test locally:
```bash
DATA=$(echo '{"conversation_id":"test","data":"sample"}' | base64)
curl -X POST http://localhost:8080 \
  -H "Content-Type: application/json" \
  -d "{\"data\":\"$DATA\"}"
```

## Security Considerations

- **Authentication**: Currently allows unauthenticated requests. Consider adding authentication for production use:
  ```bash
  gcloud functions deploy savePromptData --no-allow-unauthenticated
  ```
  
- **Rate Limiting**: Implement rate limiting to prevent abuse
- **Data Validation**: Add schema validation for payload data
- **Encryption**: Data is encrypted at rest in GCS by default

## Monitoring

View logs:
```bash
gcloud functions logs read savePromptData --limit=50
```

View in Cloud Console:
- Navigate to Cloud Run Functions
- Select `savePromptData`
- Click on "LOGS" tab

## Cost Considerations

- **Cloud Run**: Pay per request and compute time
- **Cloud Storage**: Standard storage costs apply
- **Free tier**: 2 million invocations/month included in GCP free tier

## Troubleshooting

### "Bucket not found" error
Ensure the `llm-visibility` bucket exists and the function has write permissions.

### CORS errors
The function includes CORS headers. Ensure your browser extension/client isn't sending unexpected headers.

### Base64 decode errors
Verify the data is properly base64-encoded before sending.

## License

MIT

## Contributing

Contributions welcome! Please open an issue or submit a pull request.

## Related Projects

This function is designed to work with browser extensions or client tools that capture LLM interactions for brand visibility analysis.

---

**Note**: Replace `YOUR_PROJECT_ID`, `YOUR_REGION`, and `YOUR_FUNCTION_URL` with your actual values throughout this README.
