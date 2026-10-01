# Prawko Web

## Table of Contents

* [Table of Contents](#table-of-contents)
* [Overview](#overview)
* [Prerequisites](#prerequisites)
* [Installation](#installation)
* [Usage](#usage)

---

## Overview

**Prawko Web** is a web client created with React 19, TypeScript and Material UI for Prawko projects.

It is the frontend for [Prawko Server](https://github.com/Laska254/prawko-server). All data and authentication
are handled by the server, so it must be running for the web client to work.

---

## Prerequisites

* Node.js 20.19+ or 22.12+
* npm
* Running [Prawko Server](https://github.com/Laska254/prawko-server)

### Debian 13

`sudo apt install nodejs npm`

### Windows

`winget install OpenJS.NodeJS.LTS`

---

## Installation

Run Prawko Server first. You can find instructions in
its [README](https://github.com/Laska254/prawko-server/blob/main/README.md).

Clone repository

`git clone git@github.com:Laska254/prawko-web.git`

`cd prawko-web`

Install dependencies

`npm install`

Run

`npm run dev`

Build

`npm run build`

Lint

`npm run lint`

---

## Usage

Application URL: `http://localhost:5173/`

Server URL: `http://localhost:8080/` (set in `src/requests.tsx`)

Prawko Server must allow CORS requests from the application URL.

### Pages

* `/auth` sign in and create an account
* `/` home page
* `/change-password` change password

### Used endpoints

* `/auth`
    + `POST` sign in
* `/users`
    + `POST` register new user
    + `PATCH /me/password` change password
