import { Pokemon, PokemonColor, PokemonSpecies } from "pokenode-ts";
import axios, { AxiosError, AxiosResponse } from "axios";
import { Type } from "./models/type";
import { Damage } from "./models/damage";
import { Deck } from "./models/deck";

const POKE_API = "https://pokeapi.co/api/v2";
const USERS_API = `${process.env.USERS_API_BASE_URL}:${process.env.USERS_API_PORT}`;

// TODO : check if we can rather use the accessToken as a type in itself
async function getDeck(deckId: number, accessToken: string): Promise<Deck> {
  const authAxios = axios.create({
    baseURL: USERS_API,
    headers: {
      Cookie: `token=${accessToken}`,
    },
  });
  return new Promise<Deck>((resolve, reject) => {
    authAxios
      .get<Deck>(`${USERS_API}/deck/${deckId}/`)
      .then((response: AxiosResponse<Deck>) => resolve(response.data))
      .catch((error: AxiosError<string>) => reject(error));
  });
}

/**
 * Which pokemon is the best
 */
async function getStronger(
  pokemon0: Pokemon,
  pokemon1: Pokemon
): Promise<Pokemon | undefined> {
  try {
    const type0 = getPokemonType(pokemon0);
    const type1 = getPokemonType(pokemon1);
    const damage0 = getPokemonDamage(pokemon0);
    const damage1 = getPokemonDamage(pokemon1);
    Promise.all([damage0, damage1]).then((damages) => {
      const damagesTo0 = getDamageTo(damages[0], type1);
      const damagesTo1 = getDamageTo(damages[1], type0);
      // eslint-disable-next-line prettier/prettier
      return damagesTo0 > damagesTo1
        ? pokemon1
        : // eslint-disable-next-line prettier/prettier
        damagesTo0 < damagesTo1
          ? pokemon0
          : undefined;
    });
  } catch (error) {
    console.log(error);
    return Promise.resolve(undefined);
  }
}

function getDamageTo(
  pokemonDefending: Damage,
  pokemonAttacking: Type[]
): number {
  let damage: number = 0;
  for (const type of pokemonAttacking) {
    if (pokemonDefending.doubleDamageFrom.has(type)) {
      damage += 2;
    }
    if (pokemonDefending.halfDamageFrom.has(type)) {
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
async function getPokemonColor(pokemon: Pokemon): Promise<PokemonColor> {
  let color: PokemonColor = {
    id: 0,
    name: "black",
    names: [],
    pokemon_species: [],
  };
  if (pokemon?.species) {
    const species: PokemonSpecies = await getSpecies(pokemon.species.name);
    if (species) {
      color = await getColor(species.color.name);
    }
  }
  return color;
}

/**
 * by default unknown type is returned
 */
function getPokemonType(pokemon: Pokemon): Type[] {
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

function filterType(data: { name: string; url: string }[]): Set<Type> {
  const names: Set<Type> = new Set<Type>();
  if (data.length > 0) {
    for (const name of data) {
      names.add(Type[name.name as keyof typeof Type]);
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
        damage.doubleDamageFrom = filterType(damages.double_damage_from);
        damage.doubleDamageTo = filterType(damages.double_damage_to);
        damage.halfDamageFrom = filterType(damages.half_damage_from);
        damage.halfDamageTo = filterType(damages.half_damage_to);
        damage.noDamageFrom = filterType(damages.no_damage_from);
        damage.noDamageTo = filterType(damages.no_damage_to);
        return resolve(damage);
      })
      .catch((error: AxiosError<string>) => reject(error));
  });
}

async function getPokemonDamage(pokemon: Pokemon): Promise<Damage> {
  const types: Type[] = await getPokemonType(pokemon);
  // eslint-disable-next-line prefer-const
  let damage: Damage = {
    doubleDamageFrom: new Set<Type>(),
    doubleDamageTo: new Set<Type>(),
    halfDamageFrom: new Set<Type>(),
    halfDamageTo: new Set<Type>(),
    noDamageFrom: new Set<Type>(),
    noDamageTo: new Set<Type>(),
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
  getStronger,
  getDeck,
};
