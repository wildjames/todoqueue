# ToDoQu

Life is full of small tasks that don't need to be done very often, but do need to be done. The natural solution is to batch these jobs together, and knock them out in chunks - most people would call this "chores", or "cleaning". However, sometimes it's easier to do small parts of these jobs every now and then, sacrificing the time equivalent of pocket change daily, rather than putting aside a lump sum on payday. No-one wants to sacrifice all of a Saturday cleaning a house, but a few minutes a day can eliminate the feeling of spending time cleaning.

ToDoQu is a flexible queue of what needs to be done. You can atomize chores, and be reminded to do them at your own pace when you get the time. Jobs are marked as done, and after some time become "**stale**". Stale tasks need to be completed, and become **overdue** after some window. Each job has its own schedule, and a scoreboard tracks who's done how much.

Atomizing and distributing chores across both people and time makes it easier to maintain a high level of order in a home.


# Live deployment

There is a live version of this site, deployed automatically from the `main` branch. A Github workflow automatically builds [this docker image](https://hub.docker.com/repository/docker/wizenedchimp/todoqueue/general), which is hosted on my [home server](https://todoqu.wildjames.com/). Feel free to sign up and try it out.


# Running your own server

ToDoQu is made up of four components. A Django backend, a React frontend, a SQL database for persistent storage, and a Redis cache. The redis cache currently only tracks excessive requests from users, so this can optionally be ignored and local memory used instead.

## Docker Compose

The simplest way to run an instance of ToDoQu is to use the provided docker compose stack. This starts the fontend and backend in the `web` container, along with a Redis cache and a MySQL database. From the top directory of this repo, run
```bash
docker compose up --build
```
This will run an instance of the site that should become available at `http://localhost`


## Separating concerns

The advantage of running the codes outside of docker is that changes to the code will be reflected as they are made.

To configure Django you will need to set some environment variables. This is set up to load a `.env` file, or get variables directly from the environment. 
To see what variables need to be set, along with reasonable defaults, please examine the given [.env](./todoqueue_backend/.env) file, or the `docker-compose.yml` configuration. 

Note that you will need a MySQL database already running. The redis cache is optional, and can comfortably be omitted for local development.

### Django

First, install the prerequisites. From the backend directory, [./todoqueue_backend](./todoqueue_backend/), run
```bash
pip install -r requirements.txt
```
It's best to do this in a fresh virtual environment (e.g. anaconda).

To launch the backend itself, configure the [.env](./todoqueue_backend/.env) file and run the server, instructing it to use the development mode values:
```bash
DEV=true python3 manage.py runserver
```

When running in production mode (i.e. without `DEV=true`), variables will be simply fetched from the system environment.

### React frontend

Simply enter the frontend directory, and run the frontend server
```bash
npm start
```

