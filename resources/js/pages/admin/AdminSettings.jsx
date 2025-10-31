import React, { useEffect, useState } from 'react';
import { settingService } from '../../services/api';
import toast from 'react-hot-toast';

export default function AdminSettings() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState([]);
    const [settingsByGroup, setSettingsByGroup] = useState({});
    const [editedSettings, setEditedSettings] = useState({});

    useEffect(() => {
        fetchSettings();
    }, []);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            const response = await settingService.getAll();

            const settingsData = response.data?.data || response.data || [];
            setSettings(settingsData);

            // Group settings by group
            const grouped = settingsData.reduce((acc, setting) => {
                if (!acc[setting.group]) {
                    acc[setting.group] = [];
                }
                acc[setting.group].push(setting);
                return acc;
            }, {});

            setSettingsByGroup(grouped);

            // Initialize edited settings
            const initialEdits = {};
            settingsData.forEach(setting => {
                initialEdits[setting.key] = setting.value;
            });
            setEditedSettings(initialEdits);
        } catch (error) {
            console.error('Error fetching settings:', error);
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

    const handleSaveAll = async () => {
        try {
            setSaving(true);

            // Prepare settings for bulk update
            const settingsToUpdate = Object.entries(editedSettings).map(([key, value]) => ({
                key,
                value
            }));

            await settingService.bulkUpdate(settingsToUpdate);

            toast.success('Settings saved successfully');
            await fetchSettings();
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const renderSettingInput = (setting) => {
        const value = editedSettings[setting.key] ?? setting.value;

        switch (setting.type) {
            case 'boolean':
                return (
                    <label className="flex items-center cursor-pointer">
                        <div className="relative">
                            <input
                                type="checkbox"
                                className="sr-only"
                                checked={value === 'true' || value === true || value === '1'}
                                onChange={(e) => handleSettingChange(setting.key, e.target.checked)}
                            />
                            <div className={`block w-14 h-8 rounded-full transition ${
                                (value === 'true' || value === true || value === '1')
                                    ? 'bg-blue-600'
                                    : 'bg-gray-300'
                            }`}></div>
                            <div className={`dot absolute left-1 top-1 bg-white w-6 h-6 rounded-full transition transform ${
                                (value === 'true' || value === true || value === '1')
                                    ? 'translate-x-6'
                                    : ''
                            }`}></div>
                        </div>
                    </label>
                );

            case 'number':
                return (
                    <input
                        type="number"
                        value={value}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                );

            case 'json':
                return (
                    <textarea
                        value={typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        rows={5}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                        placeholder="Enter valid JSON"
                    />
                );

            case 'textarea':
                return (
                    <textarea
                        value={value}
                        onChange={(e) => handleSettingChange(setting.key, e.target.value)}
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                );

            default: // text
                return (
                    <input
                        type="text"
                        value={value}
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="text-lg text-gray-600">Loading settings...</div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold">Settings</h1>
                <button
                    onClick={handleSaveAll}
                    disabled={saving}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition"
                >
                    {saving ? 'Saving...' : 'Save All Changes'}
                </button>
            </div>

            {Object.keys(settingsByGroup).length === 0 ? (
                <div className="bg-white p-8 rounded-lg shadow text-center">
                    <p className="text-gray-500">No settings found. Settings will appear here once configured.</p>
                </div>
            ) : (
                <div className="space-y-6">
                    {Object.entries(settingsByGroup).map(([group, groupSettings]) => (
                        <div key={group} className="bg-white p-6 rounded-lg shadow">
                            <h2 className="text-xl font-bold mb-6 text-gray-800 border-b pb-3">
                                {formatGroupName(group)}
                            </h2>

                            <div className="space-y-6">
                                {groupSettings.map((setting) => (
                                    <div key={setting.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
                                        <div className="md:col-span-1">
                                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                                {setting.key.split('_').map(word =>
                                                    word.charAt(0).toUpperCase() + word.slice(1)
                                                ).join(' ')}
                                            </label>
                                            {setting.description && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {setting.description}
                                                </p>
                                            )}
                                            <div className="mt-2 flex items-center gap-2">
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                    {setting.type}
                                                </span>
                                                <span className="text-xs text-gray-400">
                                                    Key: {setting.key}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="md:col-span-2">
                                            {renderSettingInput(setting)}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
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
