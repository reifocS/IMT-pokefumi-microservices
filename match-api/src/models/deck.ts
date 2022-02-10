import { Pokemon } from "pokenode-ts";

/* eslint-disable no-unused-vars */
export interface Deck {
  id: number;
  createdAt: Date;
  updatedAt: Date;
  authorId: number;
  author: {
    id: string;
  };
  pokemons: Pokemon[];
}
