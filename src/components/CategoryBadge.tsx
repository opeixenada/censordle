import React, {useState} from 'react';
import {ParentalGuideEntry} from "../types";

type SeverityBadgeProps = {
    entry: ParentalGuideEntry;
};

const SeverityBadge: React.FC<SeverityBadgeProps> = ({entry}) => {
    const [showTooltip, setShowTooltip] = useState(false);

    const getSeverityColor = (severity: string): string => {
        switch (severity.toLowerCase()) {
            case 'none':
                return 'green';
            case 'mild':
                return 'yellow';
            case 'moderate':
                return 'orange';
            case 'severe':
                return 'red';
            default:
                return 'gray';
        }
    };


    const getSeverityColorClass = (severity: string): string => {
        const color = getSeverityColor(severity)
        return `bg-${color}-300 text-${color}-800 ring-${color}-600/20`;
    };

    const tooltipText = entry.severity || "Severity unknown";

    return (
        <div className="relative inline-block">
            <span
                className={`
                    text-sm font-semibold px-3 py-1 rounded-full mr-2 inline-block whitespace-nowrap
                    ring-1 ring-inset
                    transition-all duration-200 ease-in-out
                    hover:opacity-80 
                    cursor-default
                    ${getSeverityColorClass(entry.severity)}
                `}
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
            >
                {entry.category}
            </span>
            {showTooltip && (
                <div
                    className="absolute z-10 px-3 py-2 text-sm font-medium text-white bg-gray-900 rounded-lg shadow-sm dark:bg-gray-700 -top-10 left-1/2 transform -translate-x-1/2 transition-opacity duration-300">
                    {tooltipText}
                    <div className="tooltip-arrow"/>
                </div>
            )}
        </div>
    );
};

export default SeverityBadge;