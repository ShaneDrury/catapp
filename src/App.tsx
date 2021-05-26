import "./App.css";
import Uploaded from "./Uploaded";
import UploadCat from "./UploadCat";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

const App = () => (
  <div className="App">
    <Router>
      <Switch>
        <Route path="/upload">
          <UploadCat />
        </Route>
        <Route path="/">
          <Uploaded />
        </Route>
      </Switch>
    </Router>
  </div>
);

export default App;
