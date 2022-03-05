# Microservices - PokeFumi

Poke-fu-mi est une application qui permet d'organiser des combats entre maîtres Pokémon mais les règles ne sont pas exactement celles du jeu classique.

## Besoins

1. [x] En tant que joueur, je peux …

   1. [x] m'inscrire à la plateforme avec un nom d'utilisateur unique.
   2. [x] me connecter à la plateforme utilisant mon nom d’utilisateur et un mot de passe
   3. [x] voir la liste de joueurs (avec leur score)
   4. [x] voir la liste de matchs
   5. [x] voir les détails d’un match: joueurs, Pokémons utilisés, etc
   6. [x] inviter un autre joueur à un match (creer un match)
   7. [x] consulter les invitations reçues
   8. [x] accepter une invitation à un match (joindre un match existant)
   9. [x] créer un deck pour un match
   10. [x] envoyer un Pokémon à l’arena et consulter le résultat du combat (le joueur n'envoie pas un Pokémon en particulier mais envoie un deck, donc au moins un Pokémon, à l'arena)

2. [ ] En tant qu’administrateur, je peux …

   1. [x] me connecter à la plateforme utilisant mon nom d’utilisateur et un mot de passe
   2. [x] voir la liste de joueurs
   3. [x] voir la liste de matchs
   4. [x] effacer et modifier les joueurs et les matchs
   5. [ ] consulter les statistiques de la plateforme : nombre de matchs par jour, nombre de matchs par pokemon, nombre de victoires par pokemon, etc

**TODO requirements :**

- ajouter un service de statistiques générés à partir de log, avec [kafka](https://hevodata.com/learn/apache-kafka-logs-a-comprehensive-guide/) ou [Elastic Stack](https://docs.microsoft.com/en-us/dotnet/architecture/cloud-native/logging-with-elastic-stack).

## Comment utiliser l'application

### Installation

#### 1. Ajout les variables d'environnement

A la racine des dossiers suivants : `users-api` et `match-api` ajouter des fichiers `.env` comportant les informations suivantes :

```txt
DATABASE_URL="postgres://User:Password@Host.db.User.com/User?schema=public"
USERS_API_BASE_URL="http://localhost"
USERS_API_PORT="3000"
MATCH_API_BASE_URL="http://localhost"
MATCH_API_PORT="3100"
SECRET="an awesome secret for our token"
```

Pour `DATABASE_URL`, on pourra utiliser des bases de données pgSQL proposées par le service suivant : [ElephantSQL - PostgreSQL as a Service](https://www.elephantsql.com/).

Si le schéma de la base de données est différent de celui indiqué dans les schémas de prisma, une erreur peut survenir. Dans ce cas on pourra remplacer la commande `RUN npx prisma db push` par `RUN npx prisma db push --accept-data-loss` dans les fichiers de configuration docker de [users-api](./users-api/Dockerfile) et de [match-api](./match-api/Dockerfile), mais ceci écrasera les données existantes.

#### 2. Exécution des commandes suivantes

```sh
git clone https://github.com/reifocS/IMT-pokefumi-microservices.git
cd ./IMT-pokefumi-microservices
docker compose build
docker compose up
```

### Documentation - Requêtes

Des exemples de requêtes sont données pour être exécutées avec l'extension chrome [Open Talend Api teste](https://chrome.google.com/webstore/detail/talend-api-tester-free-ed/aejoelaoggembcahagimdiliamlcdmfm), Celles-ci sont disponibles dans le dossier *[test](./test/)*.

## Ressources

### Diagramme d'intégration

```mermaid
graph TB
    subgraph Légende
    A((Humain))
    S_I{{Service interne}}
    S_E[Service externe]
    D[(Base de données)]
    end
```

```mermaid
graph LR
    %%variable
    U((Utilisateur))
    S_RP{{Reverse Proxy}}
    S_U{{Service des profils<br/><br/>- Login, Logout<br/>- Gestion des decks}}
    D_U[(pgSQL<br/><br/>- Profil<br/>- Deck)]
    S_M{{Service des matchs<br/><br/>- Combat<br/>- Invitation}}
    D_M[(pgSQL<br/><br/>- Match<br/>- Round)]
    S_P[Service Poke-API]
    %%relation
    U ---> S_RP
    S_U --- D_U
    S_RP <--> S_U & S_M ---> S_P
    S_M --- D_M
    %%structure
    subgraph Pokefumi Application
        subgraph Internal Network        
        S_RP
        S_U
        S_M
        end
    D_U
    D_M
    end
```

Les bases de données utilisées étaient au départ en local avec *SQLite* mais comme ce type de base de donnée ne supporte pas les enumérations alors que ce projet est réalisé en TypeScript qui supporte cette puissante fonctionnalité, nous avons décidé d'utiliser des bases de données de type pqSQL.
### Sélection du deck pour un match

```mermaid
sequenceDiagram
    %%variable
    actor U as Joueur
    participant S_U as Service des profils
    participant S_M as Service des matchs
    %%sequence
    U ->> S_U : Connection (Pseudo, Mot de passe)
    activate S_U
    S_U -->> U : Token (utilisateur)
    deactivate S_U
    U ->>+ S_M : Choix du deck pour un match (Deck, Match, Token)
    S_M ->>+ S_U : Evaluation du deck (Deck, Token du joueur)
    S_U -->>- S_M : Validation du propriétaire du deck
    S_M -->>- U : Confirmation du choix du deck
```

### Diagramme de base de données

<p><img alt="database schema" src="./doc/img/database-schema.png" width="500"></p>

## Structure des dossiers

- Le répertoire **users-api** contiendra le microservice pour répondre aux besoins de connexions et de gestion du profil utilisateur.
- Le répertoire **match-api** contiendra le microservice pour répondre aux besoins des matchs (*e.g.* matchmaking, combat).
- Le répertoire **proxy** contiendra les configurations pour le proxy.

## Connaissances acquises

### Typescript

- [TypeScript Exercises](https://typescript-exercises.github.io/)

### Formatting

- [How to add ESLint and Prettier to a React TypeScript Project (2022) | by André Borba Netto Assis | JavaScript in Plain English](https://javascript.plainenglish.io/setting-eslint-and-prettier-on-a-react-typescript-project-2021-22993565edf9)

### Principes des microservices

- [Les microservices, qu'est-ce que c'est ?](https://www.redhat.com/fr/topics/microservices/what-are-microservices)
- [Microservice Architecture — Learn, Build, and Deploy Applications - DZone Microservices](https://dzone.com/articles/microservice-architecture-learn-build-and-deploy-a)

### Prisma database

- [Getting started with Prisma, the best TypeScript ORM | by Dries Augustyns | CodeX | Medium](https://medium.com/codex/getting-started-with-the-best-typescript-orm-e0655dd3966)
- [Database connectors | Prisma Docs](https://www.prisma.io/docs/concepts/database-connectors)

### Proxy

- [Vidéo sur la comparaison d'un proxy et d'un reverse proxy](https://www.youtube.com/watch?v=MpP02aZPSNQ)
- [Comparaison des méthodes de reverse proxing with nginx](http://sawers.com/blog/reverse-proxying-with-nginx/)
- [Comprendre le serveur Nginx et les algorithmes de sélection de blocs de localisation](https://www.digitalocean.com/community/tutorials/understanding-nginx-server-and-location-block-selection-algorithms-fr#exemples)
- [nginx.conf example](https://www.nginx.com/resources/wiki/start/topics/examples/full/)

### Docker

Pour exécuter des applications Windows et Linux sur des systèmes d'exploitation (OS) différents, il est nécessaire de répliquer l'environnement requis pour celles-ci. Pour se faire, deux méthodes existent : les machines virtuelles (VMs) et les conteneurs.

![Diagramme d’architecture montrant comment les machines virtuelles s’exécutent au-dessus du noyau](https://docs.microsoft.com/fr-fr/virtualization/windowscontainers/about/media/virtual-machine-diagram.svg)
![Diagramme d’architecture montrant comment les conteneurs s’exécutent au-dessus du noyau](https://docs.microsoft.com/fr-fr/virtualization/windowscontainers/about/media/container-diagram.svg)
La comparaison de l'architecture de ces technologies montrent que pour exécuter des applications les VMs répliquent un OS indépendant et s'appuient directement sur le matériel informatique. Les conteneurs quand à eux permettent l'exécution d'applications sur l'OS hôte sans en répliquer d'autres, et s'appuient sur son kernel (noyau de l'OS hôte).

Par ailleurs, le développement, le déploiement et la gestion des applications des conteneurs sont plus simples pour les conteneurs que pour les VMs.

Dans le cadre de ce projet de microservices, une isolation totale avec des ressources garanties n'est pas nécessaire, ainsi on préfèrera la technologie des conteneurs.
L'outils permettant de gérer les configurations de conteneurs le plus utilisé est Docker.

#### Ressources utiles

- introduction
  - [Que sont les conteneurs ? | Atlassian](https://www.atlassian.com/fr/continuous-delivery/microservices/containers)
  - [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
  - [Docker Nodejs Tutorial](https://docs.docker.com/language/nodejs/)
- réseau
  - [Dealing with ports in a Docker](https://linuxhandbook.com/docker-expose-port/)
  - [Docker Compose Network - documentation](https://docs.docker.com/compose/compose-file/compose-file-v3/#networks)
  - [Understanding Docker Networking Drivers and their use cases](https://www.docker.com/blog/understanding-docker-networking-drivers-use-cases/)
  - [Docker Compose Network - pratical](https://medium.com/@caysever/docker-compose-network-b86e424fad82)
  - [Adresse IP : débuter avec le calcul des masques de sous-réseaux](https://youtu.be/qJIXgl0EjtI)
- debbuging
  - [Visual Studio Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
  - [Debugging Node.js Applications in Docker](https://github.com/docker/labs/blob/master/developer-tools/nodejs-debugging)

#### To launch our application in containers

Executer les commandes suivantes à la racine du répertoire

```bash
docker compose build
docker compose up
```

#### Dockerfile

Un petit exemple :

```bash
FROM node:17.0.1

WORKDIR /match-api/

# dependencies
COPY . .
RUN npm install

# database
COPY prisma prisma
RUN npx prisma db push
RUN npx prisma generate

CMD ["npm", "run", "build-start"]

EXPOSE 3100
```

Chaque instruction crée une couche :

- `FROM` pour créer une couche à partir de l'image Docker `node:17.0.1`.
- `WORKDIR` pour définir le répertoire de travail.
- `COPY` pour ajouter des fichiers depuis le répertoire courant (répertoire pouvant être défini par le *docker-compose.yml*) dans le dît répertoire de travail du client Docker (les fichiers du *.dockerignore* ne seront pas copiés).
- `RUN` pour préparer l'environnement.
- `CMD` pour spécifier une commande / un script à exécuter dans le conteneur afin de lancer l'image construite.
- `EXPOSE` pour informer sur quel port l'application écoute.

#### Commandes

##### Création et Exécution d'un seul conteneur

```bash
docker build -t matchs:v1 .
docker run --publish 5000:3000/tcp matchs:v1 # permettant d'autoriser le transfert des requêtes sur le port `5000` de l'hôte vers le port `3000` du conteneur.
```

##### Création et Exécution d'applications multi-containeurs

```bash
docker compose build # à faire que si l'on modifie les dockers files
docker compose up # start et monopolisation du shell (on Ctrl+C avant de relancer le shell), la monopolisation peut être empêchée avec --detach
docker compose start # start et rend la main sur le shell après (on peut restart facilement)
docker compose restart # docker compose stop + docker compose start (nécessaire pour mettre à jour l'architecture docker)
```

##### Autres commandes

| Commands                               | Purposes                                                    |
| -------------------------------------- | ----------------------------------------------------------- |
| `docker ps`                            | List running containers                                     |
| `docker images`                        | List local images                                           |
| `docker rmi <ImageName>`               | Remove an image from local registry                         |
| `docker pull [ImageName:tag]`          | Download an image from registry (docker hub)                |
| `docker exec -it <ContainerId> bash`   | Access running container (command line)                     |
| `docker stop <ContainerId>`            | Stop a running container                                    |
| `docker network ls`                    | List all the networks the Engine `daemon` knows about       |
| `docker network inspect <NetworkName>` | Return information about the selected `NetworkName` network |
