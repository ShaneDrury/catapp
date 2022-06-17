import React, { Suspense } from "react";
import { Link } from "react-router-dom";
import {
  AppBar,
  Container,
  Stack,
  styled,
  Toolbar,
  Typography,
} from "@mui/material";

const LoadingIndicator = () => <div>Loading!</div>;

const Offset = styled("div")(({ theme }) => theme.mixins.toolbar);

const Layout = ({ children }: { children: React.ReactNode }) => (
  <>
    <AppBar position="sticky">
      <Toolbar>
        <Stack direction="row" spacing={2}>
          <Typography variant="h6">Cats!</Typography>
          <Link to="/">My Cats</Link>
          <Link to="/upload">Upload a cat</Link>
        </Stack>
      </Toolbar>
    </AppBar>
    <Offset />
    <main>
      <Container>
        <Suspense fallback={<LoadingIndicator />}>{children}</Suspense>
      </Container>
    </main>
  </>
);

export default Layout;
