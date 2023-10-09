import './App.css';
import {
  BrowserRouter,
  Routes,
  Route,
} from "react-router-dom";

import {SessionContextProvider} from "./contexts/Session";
import {WalkContextProvider} from "./contexts/Walk";
import {WalkmapContextProvider} from "./contexts/Walkmap";

import GlobalHeader from "./components/global_header";
import GlobalFooter from "./components/global_footer";

import Landing from './views/Landing';
import Home from './views/Home';
import Consent from './views/Consent';
import Walk from './views/Walk';
import Summary from './views/Summary';
import Upload from './views/Upload';

function App() {
  return (
    <SessionContextProvider>
        <WalkmapContextProvider>
            <WalkContextProvider>
                <BrowserRouter>
                    <div className="view_box">
                        <GlobalHeader/>
                        <div className="view_body">
                            <Routes>
                                <Route path='/' element={<Landing />} />
                                <Route path='/home' element={<Home />} />
                                <Route path='/consent' element={<Consent />} />
                                <Route path='/walk' element={<Walk />} />
                                <Route path='/summary' element={<Summary />} />
                                <Route path='/upload' element={<Upload />} />
                            </Routes>
                        </div>
                        <GlobalFooter/>
                    </div>
                </BrowserRouter>
            </WalkContextProvider>
        </WalkmapContextProvider>
    </SessionContextProvider>
  );
}

export default App;
