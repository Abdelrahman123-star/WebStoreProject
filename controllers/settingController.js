const Setting = require('../models/Setting');

// Get store settings and render the settings page
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne({ key: 'store_settings' });

        if (!settings) {
            // If no settings exist, create a new one with defaults
            settings = new Setting({
                defaultShippingCost: 200,
                freeShippingThreshold: 550
            });
            await settings.save();
        }

        res.render('admin/settings', {
            activePage: 'settings',
            settings,
            user: req.session.user || null // Pass user for header/layout
        });
    } catch (error) {
        console.error('Error fetching settings:', error);
        req.flash('error', 'Failed to load settings.');
        res.redirect('/admin'); // Redirect to admin dashboard on error
    }
};

// Update store settings
exports.updateSettings = async (req, res) => {
    try {
        const { defaultShippingCost, freeShippingThreshold } = req.body;

        let settings = await Setting.findOne({ key: 'store_settings' });

        if (!settings) {
            settings = new Setting({
                key: 'store_settings',
                defaultShippingCost,
                freeShippingThreshold
            });
        } else {
            settings.defaultShippingCost = parseFloat(defaultShippingCost);
            settings.freeShippingThreshold = parseFloat(freeShippingThreshold);
        }

        await settings.save();

        res.status(200).json({ success: true, message: 'Settings updated successfully!' });

    } catch (error) {
        console.error('Error updating settings:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings.', error: error.message });
    }
}; 