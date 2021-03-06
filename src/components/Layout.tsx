import React from "react";
import AppBarLink from "./AppBarLink";
import {
  AppBar,
  Container,
  Stack,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";
import PetsIcon from "@mui/icons-material/Pets";

const Offset = styled("div")(({ theme }) => theme.mixins.toolbar);

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppBar position="sticky">
      <Toolbar>
        <Stack direction="row" spacing={2} alignItems="center">
          <PetsIcon />
          <Typography variant="h6">Cats!</Typography>
          <AppBarLink to="/" name="My Cats" />
          <AppBarLink to="/upload" name="Upload a cat" />
        </Stack>
      </Toolbar>
    </AppBar>
    <Offset />
    <main>
      <Container>{children}</Container>
    </main>
  </>
);

export default Layout;
