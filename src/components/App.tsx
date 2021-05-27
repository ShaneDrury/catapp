import Uploaded from "./Uploaded";
import UploadCat from "./UploadCat";

import {
  BrowserRouter as Router,
  Switch,
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
              exact
              to="/"
              className="navbar-item"
              activeClassName="is-active"
            >
              My Cats
            </NavLink>
            <NavLink
              exact
              to="/upload"
              className="navbar-item"
              activeClassName="is-active"
            >
              Upload a cat
            </NavLink>
          </div>
        </div>
      </nav>
      <main>
        <div className="section">
          <Switch>
            <Route path="/upload">
              <UploadCat />
            </Route>
            <Route path="/">
              <Uploaded />
            </Route>
          </Switch>
        </div>
      </main>
    </Router>
  </div>
);

export default App;
