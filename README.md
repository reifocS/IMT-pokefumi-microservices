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
   9. [x] créer un deck pour un match
   10. [x] envoyer un Pokémon à l’arena et consulter le résultat du combat (le joueur n'envoie pas un Pokémon en particulier mais envoie un deck, donc au moins un Pokémon, à l'arena)

2. [ ] En tant qu’administrateur, je peux …

   1. [x] me connecter à la plateforme utilisant mon nom d’utilisateur et un mot de passe
   2. [x] voir la liste de joueurs
   3. [x] voir la liste de matchs
   4. [ ] effacer et modifier les joueurs et les matchs
   5. [ ] consulter les statistiques de la plateforme : nombre de matchs par jour, nombre de matchs par pokemon, nombre de victoires par pokemon, etc

**TODO requirements :**

- ajouter un proxy avec l'authentification ([Krakend](https://www.krakend.io/docs/endpoints/sequential-proxy/)) ou sans ([Nginx](https://docs.nginx.com/))
- ajouter un service de statistiques générés à partir de log, avec [kafka](https://hevodata.com/learn/apache-kafka-logs-a-comprehensive-guide/) ou [Elastic Stack](https://docs.microsoft.com/en-us/dotnet/architecture/cloud-native/logging-with-elastic-stack).

## Ressources

### Diagramme d'intégration

**TODO mettre à jour le diagramme :**

- ajouter pgsql à distance et sqlite en local
- chemin du token

<p><img alt="integration schema" src="./doc/img/integration-schema.png" width="500"></p>

### Diagramme de base de données

<p><img alt="database schema" src="./doc/img/database-schema.png" width="500"></p>

## Structure des dossiers

- Le répertoire **users-api** contiendra le microservice pour répondre aux besoins de connexions et de gestion du profil utilisateur.
- Le répertoire **match-api** contiendra le microservice pour répondre aux besoins des matchs (_e.g._ matchmaking, combat).
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

### Docker

Pour exécuter des applications Windows et Linux sur des systèmes d'exploitation (OS) différents, il est nécessaire de répliquer l'environnement requis pour celles-ci. Pour se faire, deux méthodes existent : les machines virtuelles (VMs) et les conteneurs.

![Diagramme d’architecture montrant comment les machines virtuelles s’exécutent au-dessus du noyau](https://docs.microsoft.com/fr-fr/virtualization/windowscontainers/about/media/virtual-machine-diagram.svg)
![Diagramme d’architecture montrant comment les conteneurs s’exécutent au-dessus du noyau](https://docs.microsoft.com/fr-fr/virtualization/windowscontainers/about/media/container-diagram.svg)
La comparaison de l'architecture de ces technologies montrent que pour exécuter des applications les VMs répliquent un OS indépendant et s'appuient directement sur le matériel informatique. Les conteneurs quand à eux permettent l'exécution d'applications sur l'OS hôte sans en répliquer d'autres, et s'appuient sur son kernel (noyau de l'OS hôte).

Par ailleurs, le développement, le déploiement et la gestion des applications des conteneurs sont plus simples pour les conteneurs que pour les VMs.

Dans le cadre de ce projet de microservices, une isolation totale avec des ressources garanties n'est pas nécessaire, ainsi on préfèrera la technologie des conteneurs.
L'outils permettant de gérer les configurations de conteneurs le plus utilisé est Docker.

#### Ressources utiles

- [Que sont les conteneurs ? | Atlassian](https://www.atlassian.com/fr/continuous-delivery/microservices/containers)
- [Best practices for writing Dockerfiles](https://docs.docker.com/develop/develop-images/dockerfile_best-practices/)
- [Docker Nodejs Tutorial](https://docs.docker.com/language/nodejs/)
- [Visual Studio Code Remote Development](https://code.visualstudio.com/docs/remote/remote-overview)
- [Dealing with ports in a Docker](https://linuxhandbook.com/docker-expose-port/)

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
- `COPY` pour ajouter des fichiers depuis le répertoire courant (répertoire pouvant être défini par le _docker-compose.yml_) dans le dît répertoire de travail du client Docker (les fichiers du _.dockerignore_ ne seront pas copiés).
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
docker compose up # start et monopolisation du shell (on Ctrl+C avant de relancer le shell)
docker compose start # start et rend la main sur le shell après (on peut restart facilement)
docker compose restart # docker compose stop + docker compose start (nécessaire pour mettre à jour le )
```

##### Autres commandes

| Commands                               | Purposes                                     |
| -------------------------------------- | -------------------------------------------- |
| `docker ps`                            | List running containers                      |
| `docker images`                        | List local images                            |
| `docker rmi <*ImageName>*`             | Remove an image from local registry          |
| `docker pull [*ImageName:tag]*`        | Download an image from registry (docker hub) |
| `docker exec -it <*ContainerId>* bash` | Access running container (command line)      |
| `docker stop <*ContainerId>*`          | Stop a running container                     |
