import { Routes, Route } from "react-router-dom";
import Uploaded from "./Uploaded";
import UploadCat from "./UploadCat";
import Layout from "./Layout";

const App = () => (
  <Routes>
    <Route
      path="/upload"
      element={
        <Layout>
          <UploadCat />
        </Layout>
      }
    />
    <Route
      path="/"
      element={
        <Layout>
          <Uploaded />
        </Layout>
      }
    />
  </Routes>
);

export default App;
