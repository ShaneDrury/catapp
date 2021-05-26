import Uploaded from "./Uploaded";
import UploadCat from "./UploadCat";

import { BrowserRouter as Router, Switch, Route } from "react-router-dom";

const App = () => (
  <main className="container">
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
  </main>
);

export default App;
