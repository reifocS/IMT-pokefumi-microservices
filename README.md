# pokefumi

Poke-fu-mi est une application qui permet d'organiser des combats entre maîtres Pokémon mais les règles ne sont pas exactement celles du jeu classique.

## Besoins

1. [ ] En tant que joueur, je peux …

   1. [x] m'inscrire à la plateforme avec un nom d'utilisateur unique.
   2. [x] me connecter à la plateforme utilisant mon nom d’utilisateur et un mot de passe
   3. [x] voir la liste de joueurs (avec leur score)
   4. [x] voir la liste de matchs
   5. [x] voir les détails d’un match: joueurs, Pokémons utilisés, etc
   6. [x] inviter un autre joueur à un match (creer un match)
   7. [x] consulter les invitations reçues
   8. [x] accepter une invitation à un match (joindre un match existant)
   9. [ ] créer un deck pour un match
   10. [x] envoyer un Pokémon à l’arena et consulter le résultat du combat

2. [ ] En tant qu’administrateur, je peux …

   1. [x] me connecter à la plateforme utilisant mon nom d’utilisateur et un mot de passe
   2. [x] voir la liste de joueurs
   3. [x] voir la liste de matchs
   4. [ ] effacer et modifier les joueurs et les matchs
   5. [ ] consulter les statistiques de la plateforme : nombre de matchs par jour, nombre de matchs par pokemon, nombre de victoires par pokemon, etc

## Ressources

### Diagramme d'intégration

<p><img alt="integration schema" src="./doc/img/integration-schema.png" width="500"></p>

### Diagramme de base de données

<p><img alt="database schema" src="./doc/img/database-schema.png" width="500"></p>

## Structure des dossiers

- Le répertoire **users-api** contiendra le microservice pour répondre aux besoins de connexions et de gestion du profil utilisateur.
- Le répertoire **match-api** contiendra le microservice pour répondre aux besoins des matchs (*e.g.* matchmaking, combat).
## Connaissances acquises

### Typescript 

- [TypeScript Exercises](https://typescript-exercises.github.io/)

### Formatting

- [How to add ESLint and Prettier to a React TypeScript Project (2022) | by André Borba Netto Assis | JavaScript in Plain English](https://javascript.plainenglish.io/setting-eslint-and-prettier-on-a-react-typescript-project-2021-22993565edf9)

### Principes des microservices

- [Introducing Domain-Oriented Microservice Architecture - Uber Engineering Blog](https://eng.uber.com/microservice-architecture/)
- [Microservice Architecture — Learn, Build, and Deploy Applications - DZone Microservices](https://dzone.com/articles/microservice-architecture-learn-build-and-deploy-a)

### Database

- [Getting started with Prisma, the best TypeScript ORM | by Dries Augustyns | CodeX | Medium](https://medium.com/codex/getting-started-with-the-best-typescript-orm-e0655dd3966)
- [Database connectors | Prisma Docs](https://www.prisma.io/docs/concepts/database-connectors)

### Docker

- [Visual Studio Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
- [What will you learn in this module? | Docker Documentation](https://docs.docker.com/language/nodejs/)

Création et Utilisation de Conteneurs :

```bash
docker build -t matchs:v1 .
docker run --publish 5000:5000/tcp matchs:v1 & 
```

Autres commandes :

| Commands                               | Purposes                                     |
| -------------------------------------- | -------------------------------------------- |
| `docker ps`                            | List running containers                      |
| `docker images`                        | List local images                            |
| `docker rmi <*ImageName>*`             | Remove an image from local registry          |
| `docker pull [*ImageName:tag]*`        | Download an image from registry (docker hub) |
| `docker exec -it <*ContainerId>* bash` | Access running container (command line)      |
| `docker stop <*ContainerId>*`          | Stop a running container                     |
