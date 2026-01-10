const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add ndjson as an asset extension
config.resolver.assetExts.push('ndjson');

module.exports = config;