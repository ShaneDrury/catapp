import React from "react";
import { apiFromKey } from "./catsApi";
import Cat from "./Cat";

const api = apiFromKey();

const Uploaded = () => {
  const [uploaded, setUploaded] = React.useState([]);
  const [favourites, setFavourites] = React.useState([]);
  const [votes, setVotes] = React.useState([]);

  React.useEffect(() => {
    const getUploaded = async () => {
      const uploaded = await api.uploaded();
      return setUploaded(uploaded);
    };
    const getFavourites = async () => {
      const favourites = await api.favourites();
      return setFavourites(favourites);
    };
    const getVotes = async () => {
      const votes = await api.votes();
      return setVotes(votes.reverse());
    };
    getUploaded();
    getFavourites();
    getVotes();
  }, []);

  return (
    <div>
      {uploaded.map((catProps) => (
        <Cat
          key={catProps.id}
          {...catProps}
          favourite={favourites.find(
            (favourite) => favourite.image_id === catProps.id
          )}
          votes={votes.filter((vote) => vote.image_id === catProps.id)}
        />
      ))}
    </div>
  );
};

export default Uploaded;
