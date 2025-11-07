const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const axios = require('axios');
const rateLimit = require('express-rate-limit');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('.'));

// In-memory storage (use a database in production)
const userConfigs = new Map();
const masterKeys = new Map();

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

// Generate master key
function generateMasterKey() {
    return 'yaezo_' + crypto.randomBytes(32).toString('hex');
}

// Endpoint to register a new LLM provider configuration
app.post('/v1/register', (req, res) => {
    try {
        const { provider, apiEndpoint, apiKey, customHeaders } = req.body;
        
        if (!provider || !apiEndpoint || !apiKey) {
            return res.status(400).json({
                success: false,
                message: 'Provider, API endpoint, and API key are required'
            });
        }

        const masterKey = generateMasterKey();
        
        userConfigs.set(masterKey, {
            provider,
            apiEndpoint,
            apiKey,
            customHeaders: customHeaders || {},
            createdAt: new Date()
        });

        masterKeys.set(masterKey, true);

        res.json({
            success: true,
            masterKey,
            message: 'Configuration registered successfully',
            details: {
                provider,
                apiEndpoint,
                createdAt: new Date().toISOString()
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Main chat completions endpoint
app.post('/v1/chat/completions', async (req, res) => {
    try {
        const masterKey = req.headers['authorization']?.replace('Bearer ', '');
        
        if (!masterKey || !masterKeys.has(masterKey)) {
            return res.status(401).json({
                success: false,
                message: 'Invalid or missing master key'
            });
        }

        const config = userConfigs.get(masterKey);
        if (!config) {
            return res.status(404).json({
                success: false,
                message: 'Configuration not found'
            });
        }

        const response = await axios({
            method: 'POST',
            url: config.apiEndpoint,
            headers: {
                'Authorization': 'Bearer ' + config.apiKey,
                'Content-Type': 'application/json',
                ...config.customHeaders
            },
            data: req.body,
            timeout: 30000
        });

        res.json(response.data);

    } catch (error) {
        console.error('Proxy error:', error.message);
        
        if (error.response) {
            res.status(error.response.status).json(error.response.data);
        } else if (error.request) {
            res.status(504).json({
                success: false,
                message: 'Timeout connecting to LLM provider'
            });
        } else {
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
});

// Get configuration info
app.get('/v1/config', (req, res) => {
    const masterKey = req.headers['authorization']?.replace('Bearer ', '');
    
    if (!masterKey || !masterKeys.has(masterKey)) {
        return res.status(401).json({
            success: false,
            message: 'Invalid master key'
        });
    }

    const config = userConfigs.get(masterKey);
    if (!config) {
        return res.status(404).json({
            success: false,
            message: 'Configuration not found'
        });
    }

    res.json({
        success: true,
        provider: config.provider,
        apiEndpoint: config.apiEndpoint,
        createdAt: config.createdAt
    });
});

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'YaezoCloud API is running',
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, () => {
    console.log('YaezoCloud API running on port ' + PORT);
});
