import React, { useEffect, useState } from 'react';
import { MapIcon } from '@heroicons/react/24/outline';
import { settingService } from '../services/api';

export default function Logo({ className = '', iconClassName = 'h-8 w-8', textClassName = 'ml-2 text-xl font-bold', showText = true, text = 'TajMap' }) {
    const [logoUrl, setLogoUrl] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchLogo();
    }, []);

    const fetchLogo = async () => {
        try {
            const response = await settingService.getByGroup('general');
            // getByGroup returns an object like { key: value }, not an array
            const settings = response.data || {};
            const logoUrl = settings.site_logo_url;
            if (logoUrl) {
                setLogoUrl(logoUrl);
            }
        } catch (error) {
            // Silently fail and use default
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className={`flex items-center ${className}`}>
                <div className={`${iconClassName} bg-gray-200 rounded animate-pulse`}></div>
                {showText && <div className={`${textClassName} w-24 h-6 bg-gray-200 rounded animate-pulse`}></div>}
            </div>
        );
    }

    return (
        <div className={`flex items-center ${className}`}>
            {logoUrl ? (
                <img
                    src={logoUrl}
                    alt={text}
                    className={iconClassName + ' object-contain'}
                />
            ) : (
                <MapIcon className={iconClassName + ' text-blue-600'} />
            )}
            {showText && <span className={textClassName}>{text}</span>}
        </div>
    );
}
