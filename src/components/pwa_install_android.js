import React, { useState, useEffect } from "react";
import { Button } from 'react-bootstrap';
import "../assets/css/android_install.css";
import ov_logo from "../assets/images/logo.png";

const AndroidInstallPrompt = () => {
  const [installPromptEvent, setInstallPromptEvent] = useState(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setInstallPromptEvent(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!installPromptEvent) return;

    installPromptEvent.prompt();

    const { outcome } = await installPromptEvent.userChoice;
    if (outcome === "accepted") {
      setInstallPromptEvent(null);
    }
  };

  return (
    (installPromptEvent || 1) && (
        <div className={`pwa_install android`}>
          <p>The Discovery Tool can be installed as an app on your <b>Android device</b> using the <b>Chrome browser</b>.
                This will install an app icon on your homescreen and enable offline use of the app after being loaded for the first time.</p>

            <dl>
              <dt><img src={ov_logo} alt="app logo"/></dt>
              <dd>
                <h5>Our Voice Discovery Tool</h5>
                <p>discoverytool.ourvoice.med.stanford.edu</p>
              </dd>
              <dd className={`add_to_home`}><Button variant="primary" onClick={handleInstall}>Add to Home Screen</Button></dd>
            </dl>
        </div>
    )
  );
};

export default AndroidInstallPrompt;
