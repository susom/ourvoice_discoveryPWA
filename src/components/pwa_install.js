// Import necessary libraries
import { useState, useEffect } from 'react';
import { Modal } from 'react-bootstrap';
import { Download , XSquare} from 'react-bootstrap-icons';
import { BrowserView, MobileView } from 'react-device-detect';
import {db_project} from "../database/db";
import {getDeviceType} from "./util";

import AndroidInstallPrompt from "./pwa_install_android";

import "../assets/css/pwa_install.css";
import browser_install_1 from "../assets/images/screenshot_browser_install_1.png";
import browser_install_2 from "../assets/images/screenshot_browser_install_2.png";
import safari_install_1 from "../assets/images/ios_safari_install_1.png";
import safari_install_2 from "../assets/images/ios_safari_install_2.png";
import safari_install_3 from "../assets/images/ios_safari_install_3.png";

// Update the PWAInstallModal component to display device-specific instructions
const PWAInstallModal = () => {
  const [isInstallButtonVisible, setIsInstallButtonVisible] = useState(true);
  const [show, setShow] = useState(false);
  const deviceType      = getDeviceType();
  const PWAINSTALLED_ROW_ID = 1;

  useEffect(() => {
        const handleBeforeInstallPrompt = (e) => {
            e.preventDefault();
            setIsInstallButtonVisible(true);
        };

        const checkIfInstalled = async () => {
            const installed = await db_project.installed.get(PWAINSTALLED_ROW_ID);

            if (installed && installed.hasOwnProperty("is_complete") && installed.is_complete) {
                //ALREADY INSTALLED SO HIDE
                // setIsInstallButtonVisible(false);
            }else{
                window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
            }
        };

        checkIfInstalled();

        //CLEANUP
        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
  }, []);

  const handleInstallClick = async () => {
        handleToggle();
        await db_project.installed.put({ id: PWAINSTALLED_ROW_ID, is_complete : true });
        // setIsInstallButtonVisible(false);

        // Check if the beforeinstallprompt event has been fired
        if (window.beforeInstallPromptEvent) {
            try {
                // Show the install prompt
                const promptResult = await window.beforeInstallPromptEvent.prompt();

                // If the user accepts the installation, hide the install button
                if (promptResult.outcome === 'accepted') {
                    await db_project.installed.put({ id: PWAINSTALLED_ROW_ID, is_complete : true });

                    // setIsInstallButtonVisible(false);
                }
            } catch (err) {
                console.error('Error during installation:', err);
            }
        }
  };

  const handleToggle = () => {
      setShow(!show);
  }

  const renderInstructions = () => {
    if (deviceType === 'Android') {
      return (
        <AndroidInstallPrompt/>
      );
    }else{
        //iOS or Unknwo
        return (
            <>
                <BrowserView className={`pwa_install`}>
                    <p>The Discovery Tool can be installed as an app on your <b>desktop or laptop</b> from the <b>Google Chrome Browser</b>.
                        This will enable offline use of the app after being loaded for the first time.</p>
                    <ol>
                        <li >
                            <img style={{ maxWidth: '85%', borderRadius: '10px', display: 'block' }} src={browser_install_1} alt={`figure 1`}></img>
                            <span>Click on the pictured icon in your URL bar</span>
                        </li>
                        <li >
                            <img style={{ maxWidth: '85%', borderRadius: '10px', display: 'block' }} src={browser_install_2} alt={`figure 2`}></img>
                            <span>Confirm installation by clicking on the "Install" button</span>
                        </li>
                    </ol>
                </BrowserView>
                <MobileView className={`pwa_install`}>
                    <p>The Discovery Tool can be installed as an app on your <b>iOS device (iPhone, iPad)</b> using the <b>Safari browser</b> only.
                        This will install an app icon on hour homescreen and enable offline use of the app after being loaded for the first time.</p>
                    <ol>
                        <li >
                            <img style={{ maxWidth: '85%', borderRadius: '10px', display: 'block' }} src={safari_install_1} alt={`figure 1`}></img>
                            <span>Click on the share icon at the bottom of the Safari window (pictured)</span>
                        </li>
                        <li >
                            <img style={{ maxWidth: '85%', borderRadius: '10px', display: 'block' }} src={safari_install_2} alt={`figure 2`}></img>
                            <span>Click on "Add to Home Screen" from the context menu that pops up</span>
                        </li>
                        <li >
                            <img style={{ maxWidth: '85%', borderRadius: '10px', display: 'block' }} src={safari_install_3} alt={`figure 3`}></img>
                            <span>Confirm installation by clicking on "Add"</span>
                        </li>
                        <li >
                            <span>Finally an app icon will appear somewhere on your device's homescreen!</span>
                        </li>
                    </ol>
                </MobileView>
            </>
        )
    }
  };

  return (
    <>
      { isInstallButtonVisible && (<Download onClick={handleInstallClick} className={`pwa_install_btn`}>Install</Download>) }

      <Modal show={show} onHide={handleToggle}>
        <Modal.Header>
          <Modal.Title>App Installation Instructions</Modal.Title>
          <XSquare onClick={handleToggle} className={`modal_close_x_btn`}/>
        </Modal.Header>
        <Modal.Body>
          {renderInstructions()}
        </Modal.Body>
      </Modal>
    </>
  );
};

export default PWAInstallModal;