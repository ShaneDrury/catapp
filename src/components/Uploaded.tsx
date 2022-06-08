import Cat from "./Cat";
import React from "react";
import { useCats, useFavourites, useVotes } from "../hooks";

const Uploaded = () => {
  const { data: cats } = useCats();
  const { data: favourites } = useFavourites();
  const { data: votes } = useVotes();
  return (
    <div className="columns is-multiline">
      {cats!.map((cat) => (
        <div key={cat.id} className="column is-one-quarter">
          <Cat
            {...cat}
            favourite={favourites![cat.id]}
            votes={votes![cat.id]}
          />
        </div>
      ))}
    </div>
  );
};

export default Uploaded;
