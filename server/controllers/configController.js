const GlobalConfig = require('../models/GlobalConfig');

const getConfig = async (req, res) => {
    try {
        let config = await GlobalConfig.findOne({ key: 'main_config' });

        // Return defaults if no config yet
        if (!config) {
            config = new GlobalConfig({ key: 'main_config' });
        }

        res.json(config);
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

const updateConfig = async (req, res) => {
    try {
        let config = await GlobalConfig.findOne({ key: 'main_config' });

        if (!config) {
            config = new GlobalConfig({ key: 'main_config', ...req.body });
        } else {
            // Update fields
            Object.keys(req.body).forEach(key => {
                if (key !== 'key' && key !== '_id') {
                    config[key] = req.body[key];
                }
            });
        }

        const updatedConfig = await config.save();
        res.json(updatedConfig);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { getConfig, updateConfig };
