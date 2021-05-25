import React from "react";
import { apiFromKey } from "./catsApi";

const api = apiFromKey();

const Cat = ({ breeds, id, url, width, height, sub_id, created_at, original_filename, breed_ids, favourite, votes }) => {
  const handleDelete = () => {
    return api.deleteCat(id);
  }

  const handleToggleFavourite = () => {
    if (favourite) {
      return api.unfavouriteCat(favourite.id);
    } else {
      return api.favouriteCat(id);
    }
  }

  const handleVoteUp = () => {
    return api.voteUp(id);
  }

  const handleVoteDown = () => {
    return api.voteDown(id);
  }

  return (
      <div>
        <img src={url} alt="cat" width="25%" />
        {breeds}<br/>
        {id}<br/>
        {url}<br/>
        {width}<br/>
        {height}<br/>
        {sub_id}<br/>
        {created_at}<br/>
        {original_filename}<br/>
        {breed_ids} <br/>
        <button onClick={handleDelete}>Delete</button>
        <button onClick={handleToggleFavourite}>{favourite ? "unfavourite" : "favourite"}</button>
        {votes.map((vote) => 2 * vote.value - 1).reduce((a, b) => a + b, 0)}
        <button onClick={handleVoteUp}>Vote up</button>
        <button onClick={handleVoteDown}>Vote down</button>
      </div>
  )
}

export default Cat;
