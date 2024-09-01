import React, {useState} from 'react';

export interface ParentalGuideEntry {
    category: string;
    severity: string;
    description: string;
}

type SeverityBadgeProps = {
    entry: ParentalGuideEntry;
};

const SeverityBadge: React.FC<SeverityBadgeProps> = ({entry}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const getSeverityColorClass = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case 'none':
                return 'bg-green-300 text-green-800 ring-green-600/20';
            case 'mild':
                return 'bg-yellow-200 text-yellow-800 ring-yellow-600/20';
            case 'moderate':
                return 'bg-orange-200 text-orange-800 ring-orange-600/20';
            case 'severe':
                return 'bg-red-200 text-red-800 ring-red-600/20';
            default:
                return 'bg-gray-200 text-gray-800 ring-gray-600/20';
        }
    };

    const tooltipText = entry.severity || "Severity unknown";

    return (
        <div className="relative inline-block">
            <span
                className={`
                    text-sm font-semibold text-gray-700 px-3 py-1 rounded-full mr-2 inline-block whitespace-nowrap
                    ring-1 ring-inset
                    transition-all duration-200 ease-in-out
                    hover:opacity-80 
                    cursor-default
                    ${getSeverityColorClass(entry.severity)}
                `}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
                title={tooltipText}
            >
                {entry.category}
            </span>
            {showTooltip && (
                <div
                    className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 -top-10 left-1/2 transform -translate-x-1/2 transition-opacity duration-300">
                    {entry.severity}
                    <div className="tooltip-arrow"/>
                </div>
            )}
        </div>
    );
};

export default SeverityBadge;