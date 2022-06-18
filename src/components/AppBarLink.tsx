import React from "react";
import { Link as RouterLink, To, useHref, useMatch } from "react-router-dom";
import { Link } from "@mui/material";

type Props = {
  to: To;
  name: string;
};

const AppBarLink = ({ to, name }: Props) => {
  const href = useHref(to);
  const match = useMatch(href);
  const routeMatches = Boolean(match);
  return (
    <Link
      to={to}
      component={RouterLink}
      color="inherit"
      underline={routeMatches ? "always" : "hover"}
    >
      {name}
    </Link>
  );
};

export default AppBarLink;
