import React, { useState } from "react";
import { ParentalGuideEntry } from "../types";

type SeverityBadgeProps = {
  entry: ParentalGuideEntry;
};

const SeverityBadge: React.FC<SeverityBadgeProps> = ({ entry }) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getSeverityColor = (severity: string): string => {
    switch (severity.toLowerCase()) {
      case "none":
        return "green";
      case "mild":
        return "yellow";
      case "moderate":
        return "orange";
      case "severe":
        return "red";
      default:
        return "gray";
    }
  };

  const getSeverityColorClass = (severity: string): string => {
    const color = getSeverityColor(severity);
    return `bg-${color}-300 text-${color}-800 ring-${color}-600/20`;
  };

  const tooltipText = entry.severity || "Severity unknown";

  return (
    <div className="relative inline-block">
      <span
        className={`mr-2 inline-block cursor-default rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap ring-1 transition-all duration-200 ease-in-out ring-inset hover:opacity-80 ${getSeverityColorClass(entry.severity)} `}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {entry.category}
      </span>
      {showTooltip && (
        <div className="absolute -top-10 left-1/2 z-10 -translate-x-1/2 transform rounded-lg bg-gray-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition-opacity duration-300 dark:bg-gray-700">
          {tooltipText}
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
};

export default SeverityBadge;
