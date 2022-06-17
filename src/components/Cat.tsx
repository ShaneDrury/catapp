import React from "react";
import { Favourite, Vote, Cat as ICat } from "../types";
import FavoriteIcon from "@mui/icons-material/Favorite";
import ArrowUpwardIcon from "@mui/icons-material/ArrowUpward";
import ArrowDownwardIcon from "@mui/icons-material/ArrowDownward";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import { useFavourite, useVoteDown, useVoteUp } from "../hooks";
import {
  Button,
  ButtonGroup,
  Card,
  CardActions,
  CardContent,
  CardMedia,
  IconButton,
  Typography,
} from "@mui/material";

interface CatProps extends ICat {
  favourite: Favourite;
  votes?: Vote[];
}

const Cat = ({ id, url, favourite, votes = [] }: CatProps) => {
  const favouriteMutation = useFavourite(id, favourite);
  const voteUp = useVoteUp(id);
  const voteDown = useVoteDown(id);

  const score = React.useMemo(
    () => votes.map((vote) => 2 * vote.value - 1).reduce((a, b) => a + b, 0),
    [votes]
  );

  return (
    <Card>
      <CardMedia component="img" height={300} image={url} alt="cat" />
      <CardContent>
        <Typography>Score: {score}</Typography>
      </CardContent>
      <CardActions>
        <ButtonGroup variant="outlined">
          <Button
            aria-label={`Upvote cat ${id}`}
            disabled={voteUp.status === "loading"}
            onClick={() => voteUp.mutate()}
            startIcon={<ArrowUpwardIcon />}
          >
            Upvote
          </Button>
          <Button
            aria-label={`Downvote cat ${id}`}
            disabled={voteUp.status === "loading"}
            onClick={() => voteDown.mutate()}
            startIcon={<ArrowDownwardIcon />}
          >
            Downvote
          </Button>
        </ButtonGroup>
        <IconButton
          onClick={() => favouriteMutation.mutate()}
          color="error"
          aria-label={
            favourite ? `Unfavourite cat ${id}` : `Favourite cat ${id}`
          }
        >
          {favourite ? <FavoriteBorderIcon /> : <FavoriteIcon />}
        </IconButton>
      </CardActions>
    </Card>
  );
};

export default Cat;
