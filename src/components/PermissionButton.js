// PermissionButton.js

import React from 'react';
import LoadingSpinner from "./loading_spinner";

function PermissionButton({ permissionName, isGranted, isLoading, onGrant, iconGranted, iconLocked, description }) {
    return (
        <button
            onClick={onGrant}
            className={`permission_request permission_${permissionName} ${isGranted ? "granted" : ""}`}
        >
            <div className={`icons`}>
                {
                    isGranted
                        ? iconGranted
                        : isLoading ? <LoadingSpinner/> : iconLocked
                }
            </div>
            {description}
        </button>
    );
}

export default PermissionButton;
