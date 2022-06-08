import React, { Suspense } from "react";
import { NavLink } from "react-router-dom";

const LoadingIndicator = () => <div>Loading!</div>;

const Layout = ({ children }: { children: React.ReactNode }) => (
  <div>
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
        <Suspense fallback={<LoadingIndicator />}>{children}</Suspense>
      </div>
    </main>
  </div>
);

export default Layout;
