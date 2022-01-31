import { Pokemon, PokemonColor, PokemonSpecies } from "pokenode-ts";
import axios, { AxiosError, AxiosResponse } from "axios";

const POKE_API = "https://pokeapi.co/api/v2";

/**
 * Check if pokemon is in the deck.
 * @param pokeId
 * @returns
 */
async function isInDeck(pokeId: string): Promise<Boolean> {
  const { data } = await axios.get(POKE_API + pokeId);
  return true;
}

/**
 * Check if it has not already been played.
 * @param pokemonId
 * @returns
 */
function beenPlayed(pokemonId: string): boolean {
  return true;
}

function getPokemonById(pokemonId: number): Promise<Pokemon> {
  return new Promise<Pokemon>((resolve, reject) => {
    axios
      .get<Pokemon>(`${POKE_API}/pokemon/${pokemonId}/`)
      .then((response: AxiosResponse<Pokemon>) => resolve(response.data))
      .catch((error: AxiosError<string>) => reject(error));
  });
}

async function getPokemonByName(pokemon: string): Promise<Pokemon> {
  return new Promise<Pokemon>((resolve, reject) => {
    axios
      .get<Pokemon>(`${POKE_API}/pokemon/${pokemon}/`)
      .then((response: AxiosResponse<Pokemon>) => resolve(response.data))
      .catch((error: AxiosError<string>) => reject(error));
  });
}


function getSpecies(species: string): Promise<PokemonSpecies> {
  return new Promise<PokemonSpecies>((resolve, reject) => {
    axios
      .get<PokemonSpecies>(`${POKE_API}/pokemon-species/${species}/`)
      .then((response: AxiosResponse<PokemonSpecies>) => resolve(response.data))
      .catch((error: AxiosError<string>) => reject(error));
  });
}

function getColor(color: string): Promise<PokemonColor> {
  return new Promise<PokemonColor>((resolve, reject) => {
    axios
      .get<PokemonColor>(`${POKE_API}/pokemon-color/${color}/`)
      .then((response: AxiosResponse<PokemonColor>) => resolve(response.data))
      .catch((error: AxiosError<string>) => reject(error));
  });
}

async function getPokemonColor(pokemonId: number): Promise<PokemonColor | undefined> {
  const pokemon: Pokemon = await getPokemonById(pokemonId);
  if (pokemon?.species) {
    const species: PokemonSpecies = await getSpecies(pokemon.species.name);
    if (species) {
      return await getColor(species.color.name);
    }
  }
}

/**
 * Which pokemon is the best
 */
async function getStronger(pokeId1: number, pokeId2: number): Promise<number> {
  return 1;
}

export { isInDeck, beenPlayed, getStronger };
