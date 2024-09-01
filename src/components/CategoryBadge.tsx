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

    const severityColorMap: Record<string, string> = {
        none: 'green',
        mild: 'yellow',
        moderate: 'orange',
        severe: 'red',
    };

    const getSeverityColorClass = (severity: string): string => {
        const color = severityColorMap[severity.toLowerCase()] || 'gray';
        return `bg-${color}-200 text-${color}-800 ring-${color}-600/20`;
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