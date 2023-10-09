import { Modal, Button } from 'react-bootstrap';

import "../assets/css/modal.css";
function AlertModal(props){
    const modal_title   = props.message.hasOwnProperty("title") ? props.message.title : "";
    const modal_body    = props.message.hasOwnProperty("body") ? props.message.body : "";
    const cancel_txt    = props.message.hasOwnProperty("cancel_txt") ? props.message.cancel_txt : "";
    const ok_txt        = props.message.hasOwnProperty("ok_txt") ? props.message.ok_txt : "";

    return  (<Modal show={props.show} onHide={props.handleCancel}>
                {
                    modal_title === "" ? "" : (<Modal.Header closeButton onClick={props.handleCancel}>
                                                <Modal.Title>{modal_title}</Modal.Title>
                                            </Modal.Header>)
                }

                {
                    modal_body === "" ? "" : (<Modal.Body>
                                                <p>{modal_body}</p>
                                            </Modal.Body>)
                }

                <Modal.Footer>
                    { cancel_txt === "" ? "" : <Button variant="secondary" onClick={props.handleCancel}>{cancel_txt}</Button> }
                    { ok_txt === "" ? "" : <Button variant="primary" onClick={props.handleOK}>{ok_txt}</Button> }
                </Modal.Footer>
            </Modal>)
}

export default AlertModal;