import React, { useEffect, useState, useRef } from 'react';
import { settingService, mediaService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState([]);
    const [settingsByGroup, setSettingsByGroup] = useState({});
    const [editedSettings, setEditedSettings] = useState({});
    const [uploadingLogo, setUploadingLogo] = useState(false);
    const [logoUrl, setLogoUrl] = useState('');
    const [uploadingPopupImage, setUploadingPopupImage] = useState(false);
    const [popupImageUrl, setPopupImageUrl] = useState('');
    const [uploadingPopupImage2, setUploadingPopupImage2] = useState(false);
    const [popupImage2Url, setPopupImage2Url] = useState('');
    const [expandedGroups, setExpandedGroups] = useState({});
    const logoFileInputRef = useRef(null);
    const popupImageFileInputRef = useRef(null);
    const popupImage2FileInputRef = useRef(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingService.getAll();

            const settingsData = response.data?.data || response.data || [];
            setSettings(settingsData);

            // Group settings by group and subsection
            const grouped = settingsData.reduce((acc, setting) => {
                if (!acc[setting.group]) {
                    acc[setting.group] = {};
                }

                const subsection = setting.subsection || 'general';
                if (!acc[setting.group][subsection]) {
                    acc[setting.group][subsection] = [];
                }

                acc[setting.group][subsection].push(setting);
                return acc;
            }, {});

            setSettingsByGroup(grouped);

            // Initialize edited settings
            const initialEdits = {};
            settingsData.forEach(setting => {
                initialEdits[setting.key] = setting.value;
                // Get logo URL if it exists
                if (setting.key === 'site_logo_url') {
                    setLogoUrl(setting.value || '');
                }
                // Get popup image URL if it exists
                if (setting.key === 'landing_popup_image_url') {
                    setPopupImageUrl(setting.value || '');
                }
                // Get popup image 2 URL if it exists
                if (setting.key === 'landing_popup_image_2_url') {
                    setPopupImage2Url(setting.value || '');
                }
            });
            setEditedSettings(initialEdits);
        } catch (error) {
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSettingChange = (key, value) => {
        setEditedSettings(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleLogoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        try {
            setUploadingLogo(true);
            const response = await mediaService.upload(file, 'logo');
            const uploadedImage = response.data?.data || response.data;

            if (uploadedImage && uploadedImage.url) {
                // Save logo URL to settings
                await settingService.bulkUpdate([
                    {
                        key: 'site_logo_url',
                        value: uploadedImage.url,
                        type: 'string',
                        group: 'general',
                        subsection: 'branding',
                        label: 'Site Logo URL',
                        description: 'URL of the site logo image'
                    },
                    {
                        key: 'site_logo_id',
                        value: uploadedImage.id.toString(),
                        type: 'integer',
                        group: 'general',
                        subsection: 'branding',
                        label: 'Site Logo Media ID',
                        description: 'Media ID of the site logo'
                    }
                ]);

                setLogoUrl(uploadedImage.url);
                toast.success('Logo uploaded successfully');
                await fetchSettings();
            } else {
                toast.error('Upload succeeded but no URL returned');
            }
        } catch (error) {
            toast.error('Failed to upload logo');
        } finally {
            setUploadingLogo(false);
        }
    };

    const handlePopupImageUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        try {
            setUploadingPopupImage(true);
            const response = await mediaService.upload(file, 'popup');
            const uploadedImage = response.data?.data || response.data;

            if (uploadedImage && uploadedImage.url) {
                // Save popup image URL to settings
                await settingService.bulkUpdate([
                    {
                        key: 'landing_popup_image_url',
                        value: uploadedImage.url,
                        type: 'string',
                        group: 'appearance',
                        subsection: 'landing_page',
                        label: 'Landing Page Popup Image URL',
                        description: 'Image displayed in the animated popup on landing page'
                    },
                    {
                        key: 'landing_popup_image_id',
                        value: uploadedImage.id.toString(),
                        type: 'integer',
                        group: 'appearance',
                        subsection: 'landing_page',
                        label: 'Landing Page Popup Image Media ID',
                        description: 'Media ID of the landing page popup image'
                    },
                    {
                        key: 'landing_popup_enabled',
                        value: 'true',
                        type: 'boolean',
                        group: 'appearance',
                        subsection: 'landing_page',
                        label: 'Enable Landing Page Popup',
                        description: 'Show or hide the animated popup on landing page'
                    }
                ]);

                setPopupImageUrl(uploadedImage.url);
                toast.success('Popup image uploaded successfully');
                await fetchSettings();
            } else {
                toast.error('Upload succeeded but no URL returned');
            }
        } catch (error) {
            toast.error('Failed to upload popup image');
        } finally {
            setUploadingPopupImage(false);
        }
    };

    const handlePopupImage2Upload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            toast.error('Please upload an image file');
            return;
        }

        try {
            setUploadingPopupImage2(true);
            const response = await mediaService.upload(file, 'popup');
            const uploadedImage = response.data?.data || response.data;

            if (uploadedImage && uploadedImage.url) {
                // Save popup image 2 URL to settings
                await settingService.bulkUpdate([
                    {
                        key: 'landing_popup_image_2_url',
                        value: uploadedImage.url,
                        type: 'string',
                        group: 'appearance',
                        subsection: 'landing_page',
                        label: 'Landing Page Popup Image 2 URL',
                        description: 'Second image displayed in the animated popup on landing page'
                    },
                    {
                        key: 'landing_popup_image_2_id',
                        value: uploadedImage.id.toString(),
                        type: 'integer',
                        group: 'appearance',
                        subsection: 'landing_page',
                        label: 'Landing Page Popup Image 2 Media ID',
                        description: 'Media ID of the landing page popup image 2'
                    }
                ]);

                setPopupImage2Url(uploadedImage.url);
                toast.success('Popup image 2 uploaded successfully');
                await fetchSettings();
            } else {
                toast.error('Upload succeeded but no URL returned');
            }
        } catch (error) {
            toast.error('Failed to upload popup image 2');
        } finally {
            setUploadingPopupImage2(false);
        }
    };

    const handleSaveAll = async () => {
        try {
            setSaving(true);

            // Prepare settings for bulk update - preserve all original fields
            const settingsToUpdate = settings.map(setting => {
                const updatedValue = editedSettings[setting.key] ?? setting.value;

                // Ensure value is never null - convert to empty string if needed
                const finalValue = updatedValue === null || updatedValue === undefined ? '' : updatedValue;

                return {
                    key: setting.key,
                    value: finalValue,
                    type: setting.type || 'string',
                    group: setting.group || 'general',
                    subsection: setting.subsection || null,
                    label: setting.label || null,
                    description: setting.description || null,
                };
            });

            await settingService.bulkUpdate(settingsToUpdate);

            toast.success('Settings saved successfully');
            await fetchSettings();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const getSettingUsage = (key) => {
        // Map settings to where they're used in the application
        const usageMap = {
            'site_name': { page: 'Landing Page, Admin Header', status: 'active' },
            'site_description': { page: 'Landing Page Meta', status: 'active' },
            'contact_email': { page: 'Contact Forms, Footer', status: 'not-implemented' },
            'contact_phone': { page: 'Contact Section', status: 'not-implemented' },
            'maintenance_mode': { page: 'Public Access Control', status: 'not-implemented' },
            'email_from_address': { page: 'Email Configuration', status: 'not-implemented' },
            'email_from_name': { page: 'Email Configuration', status: 'not-implemented' },
            'email_notifications': { page: 'Notification System', status: 'not-implemented' },
            'lead_auto_assignment': { page: 'Lead Management', status: 'not-implemented' },
            'lead_max_per_admin': { page: 'Lead Distribution', status: 'not-implemented' },
            'lead_follow_up_days': { page: 'Lead Reminders', status: 'not-implemented' },
            'plot_default_status': { page: 'New Plot Creation', status: 'not-implemented' },
            'plot_image_max_size': { page: 'Image Upload Validation', status: 'not-implemented' },
            'plot_featured_limit': { page: 'Featured Plots Display', status: 'not-implemented' },
            'theme_primary_color': { page: 'Site Theming', status: 'not-implemented' },
            'items_per_page': { page: 'Pagination', status: 'not-implemented' },
            'show_plot_prices': { page: 'Interactive Map, Plot Display', status: 'active' },
            'map_default_zoom': { page: 'Map Display', status: 'not-implemented' },
            'map_center_latitude': { page: 'Map Center', status: 'not-implemented' },
            'map_center_longitude': { page: 'Map Center', status: 'not-implemented' },
            'site_logo_url': { page: 'Headers, Navigation', status: 'active' },
            'site_logo_id': { page: 'Logo Management', status: 'active' },
        };

        return usageMap[key] || { page: 'Unknown', status: 'not-implemented' };
    };

    const getSettingOptions = (setting) => {
        // Define dropdown options for specific settings
        const optionsMap = {
            'plot_default_status': [
                { value: 'Available', label: 'Available' },
                { value: 'Reserved', label: 'Reserved' },
                { value: 'Sold', label: 'Sold' }
            ],
        };

        return optionsMap[setting.key] || null;
    };

    const renderSettingInput = (setting) => {
        const value = editedSettings[setting.key] ?? setting.value;

        // Ensure value is never null or undefined
        const safeValue = value === null || value === undefined ? '' : value;

        // Check if this setting has predefined options
        const options = getSettingOptions(setting);
        if (options) {
            return (
                <select
                    value={safeValue}
                    onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                    {options.map(opt => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    ))}
                </select>
            );
        }

        switch (setting.type) {
            case 'boolean':
                return (
                    <select
                        value={safeValue === true || safeValue === 'true' || safeValue === '1' || safeValue === 1 ? 'true' : 'false'}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    >
                        <option value="true">Enabled / True</option>
                        <option value="false">Disabled / False</option>
                    </select>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={safeValue}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                );

            case 'json':
                return (
                    <textarea
                        value={typeof safeValue === 'object' ? JSON.stringify(safeValue, null, 2) : safeValue}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Enter valid JSON"
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={safeValue}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                );

            default: // text
                return (
                    <input
                        type="text"
                        value={safeValue}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                );
        }
    };

    const formatGroupName = (group) => {
        return group
            .split('_')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join(' ');
    };

    const toggleGroup = (group) => {
        setExpandedGroups(prev => ({
            ...prev,
            [group]: !prev[group]
        }));
    };

    const getGroupIcon = (group) => {
        const icons = {
            general: '⚙️',
            map: '🗺️',
            email: '📧',
            appearance: '🎨',
            security: '🔒',
            payment: '💳',
            api: '🔌',
        };
        return icons[group] || '📋';
    };

    const expandAll = () => {
        const allExpanded = {};
        Object.keys(settingsByGroup).forEach(group => {
            allExpanded[group] = true;
        });
        setExpandedGroups(allExpanded);
    };

    const collapseAll = () => {
        setExpandedGroups({});
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading settings...</div>
            </div>
        );
    }

    const allExpanded = Object.keys(settingsByGroup).length > 0 &&
        Object.keys(settingsByGroup).every(group => expandedGroups[group]);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold">Settings</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage your application settings and configuration</p>
                </div>
                <div className="flex gap-2">
                    {Object.keys(settingsByGroup).length > 0 && (
                        <button
                            onClick={allExpanded ? collapseAll : expandAll}
                            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition text-sm"
                        >
                            {allExpanded ? 'Collapse All' : 'Expand All'}
                        </button>
                    )}
                    <button
                        onClick={handleSaveAll}
                        disabled={saving}
                        className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                    >
                        {saving ? 'Saving...' : 'Save All Changes'}
                    </button>
                </div>
            </div>

            {/* Logo Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-3">Site Logo</h2>
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        {logoUrl ? (
                            <img
                                src={logoUrl}
                                alt="Site Logo"
                                className="w-32 h-32 object-contain border-2 border-gray-200 rounded-lg p-2 bg-gray-50"
                            />
                        ) : (
                            <div className="w-32 h-32 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Upload Site Logo</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Upload a logo to display on your site. The logo will appear in the navigation header on both user and admin dashboards.
                            Recommended size: 200x200px. Supported formats: JPG, PNG, GIF, WEBP.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => logoFileInputRef.current?.click()}
                                disabled={uploadingLogo}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
                            >
                                {uploadingLogo ? 'Uploading...' : logoUrl ? 'Change Logo' : 'Upload Logo'}
                            </button>
                            {logoUrl && (
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to remove the logo?')) {
                                            try {
                                                // Find the logo settings to preserve their metadata
                                                const logoUrlSetting = settings.find(s => s.key === 'site_logo_url');
                                                const logoIdSetting = settings.find(s => s.key === 'site_logo_id');

                                                const updatePayload = [];
                                                if (logoUrlSetting) {
                                                    updatePayload.push({
                                                        key: 'site_logo_url',
                                                        value: '',
                                                        type: logoUrlSetting.type,
                                                        group: logoUrlSetting.group,
                                                        subsection: logoUrlSetting.subsection,
                                                        label: logoUrlSetting.label,
                                                        description: logoUrlSetting.description,
                                                    });
                                                }
                                                if (logoIdSetting) {
                                                    updatePayload.push({
                                                        key: 'site_logo_id',
                                                        value: '',
                                                        type: logoIdSetting.type,
                                                        group: logoIdSetting.group,
                                                        subsection: logoIdSetting.subsection,
                                                        label: logoIdSetting.label,
                                                        description: logoIdSetting.description,
                                                    });
                                                }

                                                await settingService.bulkUpdate(updatePayload);
                                                setLogoUrl('');
                                                toast.success('Logo removed successfully');
                                                await fetchSettings();
                                            } catch (error) {
                                                toast.error('Failed to remove logo');
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                >
                                    Remove Logo
                                </button>
                            )}
                        </div>
                        <input
                            ref={logoFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleLogoUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Landing Page Popup Image Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-3">Landing Page Popup Image</h2>
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        {popupImageUrl ? (
                            <img
                                src={popupImageUrl}
                                alt="Popup Image"
                                className="w-48 h-48 object-cover border-2 border-gray-200 rounded-lg bg-gray-50"
                            />
                        ) : (
                            <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Upload Popup Image</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Upload an image to display in an animated popup when users first visit the landing page.
                            The popup will animate with a zoom and translate effect to showcase your image.
                            Recommended size: 1200x800px or larger. Supported formats: JPG, PNG, GIF, WEBP.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => popupImageFileInputRef.current?.click()}
                                disabled={uploadingPopupImage}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
                            >
                                {uploadingPopupImage ? 'Uploading...' : popupImageUrl ? 'Change Image' : 'Upload Image'}
                            </button>
                            {popupImageUrl && (
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to remove the popup image?')) {
                                            try {
                                                const popupUrlSetting = settings.find(s => s.key === 'landing_popup_image_url');
                                                const popupIdSetting = settings.find(s => s.key === 'landing_popup_image_id');
                                                const popupEnabledSetting = settings.find(s => s.key === 'landing_popup_enabled');

                                                const updatePayload = [];
                                                if (popupUrlSetting) {
                                                    updatePayload.push({
                                                        key: 'landing_popup_image_url',
                                                        value: '',
                                                        type: popupUrlSetting.type,
                                                        group: popupUrlSetting.group,
                                                        subsection: popupUrlSetting.subsection,
                                                        label: popupUrlSetting.label,
                                                        description: popupUrlSetting.description,
                                                    });
                                                }
                                                if (popupIdSetting) {
                                                    updatePayload.push({
                                                        key: 'landing_popup_image_id',
                                                        value: '',
                                                        type: popupIdSetting.type,
                                                        group: popupIdSetting.group,
                                                        subsection: popupIdSetting.subsection,
                                                        label: popupIdSetting.label,
                                                        description: popupIdSetting.description,
                                                    });
                                                }
                                                if (popupEnabledSetting) {
                                                    updatePayload.push({
                                                        key: 'landing_popup_enabled',
                                                        value: 'false',
                                                        type: popupEnabledSetting.type,
                                                        group: popupEnabledSetting.group,
                                                        subsection: popupEnabledSetting.subsection,
                                                        label: popupEnabledSetting.label,
                                                        description: popupEnabledSetting.description,
                                                    });
                                                }

                                                await settingService.bulkUpdate(updatePayload);
                                                setPopupImageUrl('');
                                                toast.success('Popup image removed successfully');
                                                await fetchSettings();
                                            } catch (error) {
                                                toast.error('Failed to remove popup image');
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                >
                                    Remove Image
                                </button>
                            )}
                        </div>
                        <input
                            ref={popupImageFileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePopupImageUpload}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {/* Landing Page Popup Image 2 Upload Section */}
            <div className="bg-white p-6 rounded-lg shadow">
                <h2 className="text-xl font-bold mb-4 text-gray-800 border-b pb-3">Landing Page Popup Image 2</h2>
                <div className="flex items-start gap-6">
                    <div className="flex-shrink-0">
                        {popupImage2Url ? (
                            <img
                                src={popupImage2Url}
                                alt="Popup Image 2"
                                className="w-48 h-48 object-cover border-2 border-gray-200 rounded-lg bg-gray-50"
                            />
                        ) : (
                            <div className="w-48 h-48 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center bg-gray-50">
                                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                    </div>
                    <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-2">Upload Second Popup Image</h3>
                        <p className="text-sm text-gray-600 mb-4">
                            Upload a second image to display alongside the first popup image on the landing page.
                            This allows for multiple promotional images or announcements.
                            Recommended size: 1200x800px or larger. Supported formats: JPG, PNG, GIF, WEBP.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => popupImage2FileInputRef.current?.click()}
                                disabled={uploadingPopupImage2}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 transition"
                            >
                                {uploadingPopupImage2 ? 'Uploading...' : popupImage2Url ? 'Change Image' : 'Upload Image'}
                            </button>
                            {popupImage2Url && (
                                <button
                                    onClick={async () => {
                                        if (confirm('Are you sure you want to remove popup image 2?')) {
                                            try {
                                                const popupUrl2Setting = settings.find(s => s.key === 'landing_popup_image_2_url');
                                                const popupId2Setting = settings.find(s => s.key === 'landing_popup_image_2_id');

                                                const updatePayload = [];
                                                if (popupUrl2Setting) {
                                                    updatePayload.push({
                                                        key: 'landing_popup_image_2_url',
                                                        value: '',
                                                        type: popupUrl2Setting.type,
                                                        group: popupUrl2Setting.group,
                                                        subsection: popupUrl2Setting.subsection,
                                                        label: popupUrl2Setting.label,
                                                        description: popupUrl2Setting.description,
                                                    });
                                                }
                                                if (popupId2Setting) {
                                                    updatePayload.push({
                                                        key: 'landing_popup_image_2_id',
                                                        value: '',
                                                        type: popupId2Setting.type,
                                                        group: popupId2Setting.group,
                                                        subsection: popupId2Setting.subsection,
                                                        label: popupId2Setting.label,
                                                        description: popupId2Setting.description,
                                                    });
                                                }

                                                await settingService.bulkUpdate(updatePayload);
                                                setPopupImage2Url('');
                                                toast.success('Popup image 2 removed successfully');
                                                await fetchSettings();
                                            } catch (error) {
                                                toast.error('Failed to remove popup image 2');
                                            }
                                        }
                                    }}
                                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                                >
                                    Remove Image
                                </button>
                            )}
                        </div>
                        <input
                            ref={popupImage2FileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handlePopupImage2Upload}
                            className="hidden"
                        />
                    </div>
                </div>
            </div>

            {Object.keys(settingsByGroup).length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-gray-500">No settings found. Settings will appear here once configured.</p>
                </div>
            ) : (
                <div className="space-y-3">
                    {Object.entries(settingsByGroup).map(([group, subsections]) => {
                        const isExpanded = expandedGroups[group] ?? false;
                        const totalSettings = Object.values(subsections).reduce((sum, settings) => sum + settings.length, 0);

                        return (
                            <div key={group} className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
                                {/* Group Header - Collapsible */}
                                <button
                                    onClick={() => toggleGroup(group)}
                                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-3">
                                        <span className="text-2xl">{getGroupIcon(group)}</span>
                                        <div className="text-left">
                                            <h2 className="text-lg font-bold text-gray-800">
                                                {formatGroupName(group)}
                                            </h2>
                                            <p className="text-xs text-gray-500">
                                                {totalSettings} {totalSettings === 1 ? 'setting' : 'settings'}
                                                {Object.keys(subsections).length > 1 && ` • ${Object.keys(subsections).length} subsections`}
                                            </p>
                                        </div>
                                    </div>
                                    <svg
                                        className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* Group Content with Subsections - Expandable */}
                                {isExpanded && (
                                    <div className="border-t border-gray-200 bg-gray-50">
                                        {Object.entries(subsections).map(([subsection, subsectionSettings], subsectionIndex) => (
                                            <div key={subsection} className={subsectionIndex !== 0 ? 'border-t border-gray-200' : ''}>
                                                {/* Subsection Header */}
                                                {subsection !== 'general' && (
                                                    <div className="px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-50">
                                                        <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide">
                                                            {formatGroupName(subsection)}
                                                        </h3>
                                                    </div>
                                                )}

                                                {/* Settings in Subsection */}
                                                <div className="px-6 py-4">
                                                    <div className="space-y-4">
                                                        {subsectionSettings.map((setting, index) => (
                                                            <div
                                                                key={setting.id}
                                                                className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition"
                                                            >
                                                                <div className="flex flex-col md:flex-row md:items-start gap-4">
                                                                    <div className="md:w-1/3">
                                                                        <label className="block text-sm font-semibold text-gray-800 mb-1">
                                                                            {setting.key.split('_').map(word =>
                                                                                word.charAt(0).toUpperCase() + word.slice(1)
                                                                            ).join(' ')}
                                                                        </label>
                                                                        {setting.description && (
                                                                            <p className="text-xs text-gray-500 mt-1 mb-2">
                                                                                {setting.description}
                                                                            </p>
                                                                        )}
                                                                        <div className="flex flex-wrap items-center gap-2 mb-2">
                                                                            <span className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                                                                                {setting.type}
                                                                            </span>
                                                                            <span className="text-xs text-gray-400 font-mono">
                                                                                {setting.key}
                                                                            </span>
                                                                        </div>
                                                                        {(() => {
                                                                            const usage = getSettingUsage(setting.key);
                                                                            return (
                                                                                <div className="mt-2">
                                                                                    <div className="flex items-center gap-2">
                                                                                        {usage.status === 'active' ? (
                                                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-green-100 text-green-800 rounded font-medium">
                                                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                                                                </svg>
                                                                                                Active
                                                                                            </span>
                                                                                        ) : (
                                                                                            <span className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-yellow-100 text-yellow-800 rounded font-medium">
                                                                                                <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                                                                                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                                                                                </svg>
                                                                                                Not Applied
                                                                                            </span>
                                                                                        )}
                                                                                        <span className="text-xs text-gray-600">
                                                                                            Used in: {usage.page}
                                                                                        </span>
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })()}
                                                                    </div>

                                                                    <div className="md:w-2/3">
                                                                        {renderSettingInput(setting)}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Info Box */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div>
                        <h3 className="text-sm font-semibold text-blue-900">About Settings</h3>
                        <p className="text-sm text-blue-800 mt-1">
                            These settings control various aspects of your application. Changes are saved when you click "Save All Changes".
                            Be careful when editing JSON settings - invalid JSON will cause errors.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
