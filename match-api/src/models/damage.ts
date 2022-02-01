import { Type } from "./type";

export type Damage = {
  doubleDamageFrom: Set<Type>;
  doubleDamageTo: Set<Type>;
  halfDamageFrom: Set<Type>;
  halfDamageTo: Set<Type>;
  noDamageFrom: Set<Type>;
  noDamageTo: Set<Type>;
};
