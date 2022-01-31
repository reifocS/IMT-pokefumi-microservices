import {
  Pokemon,
  PokemonColor,
  PokemonSpecies,
  PokemonType,
} from "pokenode-ts";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Type } from "./models/type";
import { Damage } from "./models/damage";

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

/**
 * Which pokemon is the best
 */
function getStronger(
  pokemonId0: number,
  pokemonId1: number
): number | undefined {
  try {
    const type0 = getPokemonType(pokemonId0);
    const type1 = getPokemonType(pokemonId1);
    const damage0 = getPokemonDamage(pokemonId0);
    const damage1 = getPokemonDamage(pokemonId1);
    Promise.all([type0, type1, damage0, damage1]).then((res) => {
      const damageTo0 = getDamageTo(res[2], res[1]);
      const damageTo1 = getDamageTo(res[3], res[0]);
      Promise.all([damageTo0, damageTo1]).then((damagesTo) => {
        // eslint-disable-next-line prettier/prettier
        return damagesTo[0] > damagesTo[1] ? pokemonId1
          : // eslint-disable-next-line prettier/prettier
          damagesTo[0] < damagesTo[1] ? pokemonId0 : undefined;
      });
    });
  } catch (error) {
    console.log(error);
    return undefined;
  }
}

function getDamageTo(
  pokemonDefending: Damage,
  pokemonAttacking: Type[]
): number {
  let damage: number = 0;
  for (const type of pokemonAttacking) {
    if (pokemonDefending.doubleDamageFrom.has(type.toString())) {
      damage += 2;
    }
    if (pokemonDefending.halfDamageFrom.has(type.toString())) {
      ++damage;
    }
  }
  return damage;
}

function getPokemonById(pokemonId: number): Promise<Pokemon> {
  return new Promise<Pokemon>((resolve, reject) => {
    axios
      .get<Pokemon>(`${POKE_API}/pokemon/${pokemonId}/`)
      .then((response: AxiosResponse<Pokemon>) => resolve(response.data))
      .catch((error: AxiosError<string>) => reject(error));
  });
}

function getPokemonByName(pokemon: string): Promise<Pokemon> {
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

/**
 * by default black is returned
 */
async function getPokemonColor(pokemonId: number): Promise<PokemonColor> {
  let color: PokemonColor = {
    id: 0,
    name: "black",
    names: [],
    pokemon_species: [],
  };
  const pokemon: Pokemon = await getPokemonById(pokemonId);
  if (pokemon?.species) {
    const species: PokemonSpecies = await getSpecies(pokemon.species.name);
    if (species) {
      color = await getColor(species.color.name);
    }
  }
  return color;
}

function getType(type: string): Promise<PokemonType> {
  return new Promise<PokemonType>((resolve, reject) => {
    axios
      .get<PokemonType>(`${POKE_API}/type/${type}/`)
      .then((response: AxiosResponse<PokemonType>) => resolve(response.data))
      .catch((error: AxiosError<string>) => reject(error));
  });
}

/**
 * by default unknow type is returned
 */
async function getPokemonType(pokemonId: number): Promise<Type[]> {
  const pokemon: Pokemon = await getPokemonById(pokemonId);
  if (pokemon?.types && pokemon.types.length > 0) {
    let types!: Type[];
    for (const type of pokemon.types) {
      types.push(Type[type.type.name as keyof typeof Type]);
    }
    return types;
  } else {
    return [Type.unknown];
  }
}

function getName(data: { name: string; url: string }[]): Set<string> {
  const names: Set<string> = new Set<string>();
  if (data.length > 0) {
    for (const name of data) {
      names.add(name.name);
    }
  }
  return names;
}

function getDamageFromType(type: Type): Promise<Damage> {
  let damage: Damage;
  return new Promise<Damage>((resolve, reject) => {
    axios
      .get(`${POKE_API}/type/${type.toString()}/`)
      .then((response) => {
        const damages = response.data.damage_relations;
        damage.doubleDamageFrom = getName(damages.double_damage_from);
        damage.doubleDamageTo = getName(damages.double_damage_to);
        damage.halfDamageFrom = getName(damages.half_damage_from);
        damage.halfDamageTo = getName(damages.half_damage_to);
        damage.noDamageFrom = getName(damages.no_damage_from);
        damage.noDamageTo = getName(damages.no_damage_to);
        return resolve(damage);
      })
      .catch((error: AxiosError<string>) => reject(error));
  });
}

async function getPokemonDamage(pokemonId: number): Promise<Damage> {
  const types = await getPokemonType(pokemonId);
  // eslint-disable-next-line prefer-const
  let damage: Damage = {
    doubleDamageFrom: new Set<string>(),
    doubleDamageTo: new Set<string>(),
    halfDamageFrom: new Set<string>(),
    halfDamageTo: new Set<string>(),
    noDamageFrom: new Set<string>(),
    noDamageTo: new Set<string>(),
  };
  for (const type of types) {
    getDamageFromType(type).then((damageNew: Damage) => {
      let attribute: keyof typeof damage;
      for (attribute in damage) {
        damage[attribute].forEach(
          damageNew[attribute].add,
          damageNew[attribute]
        );
      }
    });
  }
  return damage;
}

export {
  getPokemonByName,
  getPokemonById,
  getPokemonColor,
  isInDeck,
  beenPlayed,
  getStronger,
};
