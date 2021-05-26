import { apiFromKey, Cat as ICat, Favourite, Vote } from "./catsApi";
import Cat from "./Cat";
import { groupBy } from "lodash";
import React from "react";

const api = apiFromKey();

interface CatState extends ICat {
  loading: boolean;
}

const Uploaded = () => {
  const [catIds, setCatIds] = React.useState<string[]>([]);
  const [catData, setCatData] = React.useState<{ [key: string]: CatState }>({});
  const [favourites, setFavourites] = React.useState<{
    [key: string]: Favourite;
  }>({});
  const [votes, setVotes] = React.useState<{ [key: string]: Vote[] }>({});

  const getVotes = async () => {
    const votes = await api.votes();
    return setVotes(groupBy(votes, (vote) => vote.image_id));
  };

  const getCats = async () => {
    const cats = await api.uploaded();
    setCatIds(cats.map((cat) => cat.id));
    setCatData(cats.reduce((acc, cat) => ({ ...acc, [cat.id]: cat }), {}));
  };

  const getFavourites = async () => {
    const favourites = await api.favourites();
    return setFavourites(
      favourites.reduce(
        (acc, favourite) => ({ ...acc, [favourite.image_id]: favourite }),
        {}
      )
    );
  };

  React.useEffect(() => {
    getCats();
    getFavourites();
    getVotes();
  }, []);

  const handleVoteChange = async (id: string) => {
    setCatData({ ...catData, [id]: { ...catData[id], loading: true } });
    await getVotes();
    setCatData({ ...catData, [id]: { ...catData[id], loading: false } });
  };

  const handleFavouriteChange = async (id: string) => {
    setCatData({ ...catData, [id]: { ...catData[id], loading: true } });
    await getFavourites();
    setCatData({ ...catData, [id]: { ...catData[id], loading: false } });
  };

  return (
    <div>
      {catIds.map((id) => (
        <Cat
          key={id}
          {...catData[id]}
          favourite={favourites[id]}
          votes={votes[id]}
          onVoteChange={() => handleVoteChange(id)}
          onFavouriteChange={() => handleFavouriteChange(id)}
        />
      ))}
    </div>
  );
};

export default Uploaded;
