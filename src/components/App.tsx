import Uploaded from "./Uploaded";
import UploadCat from "./UploadCat";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  NavLink,
} from "react-router-dom";

const App = () => (
  <div>
    <Router>
      <nav
        className="navbar is-link"
        role="navigation"
        aria-label="main navigation"
      >
        <div className="navbar-brand">
          <div className="navbar-item">Cats!</div>
        </div>
        <div id="navbarBasicExample" className="navbar-menu">
          <div className="navbar-start">
            <NavLink
              end
              to="/"
              className={({ isActive }) =>
                "navbar-item" + (isActive ? " is-active" : "")
              }
            >
              My Cats
            </NavLink>
            <NavLink
              end
              to="/upload"
              className={({ isActive }) =>
                "navbar-item" + (isActive ? " is-active" : "")
              }
            >
              Upload a cat
            </NavLink>
          </div>
        </div>
      </nav>
      <main>
        <div className="section">
          <Routes>
            <Route path="/upload" element={<UploadCat />} />
            <Route path="/" element={<Uploaded />} />
          </Routes>
        </div>
      </main>
    </Router>
  </div>
);

export default App;
