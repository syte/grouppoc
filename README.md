# Group POC

## Introduction
A demo of how to update user groups out of band. Whenever an admin changes the criteria for groups and submits it, we don't want to process the update in real time because
that would provide a poor experiencew given enough data. This application consumes group updates via rabbitmq and processes them one by one and updates the db. By having
this out of band, you can keep user experience just as quick.

## Why this approach?
So ideally, i'd do benchmarks in real life to quantify the slowness of the application. Sometimes we could get by with a different solution. A few of the other approaches I thought about was making sure indexing was done on the update query. Also, instead of storing groups in the database, since it's computed, we can just compute groups within the application code. Now
updating user state doesn't have to update user groups. One big downside to this approach is that now you have to remember to pull all user demographic data to compute groups in the application. There are rule engines that may serve us well after doing a bit more digging.

## How to run
`docker-compose up` from the root of the application to see it in action.
This will spin up a service that produces group updates, and another one that consumes the group updates, processes them, and updates the user groups in the database. Obviously this a mock example. Right now the group calculator processes a group at a time, but it's entirely realistic to break up each group update into multiple database level requests. By default it'll populate the database with some mock data so we can run the application.

## Notes 
The code is to highlight the diagram I had sent in. It's a POC so closing connections is missing since it won't be going into production. Mainly just wanted to highlight what I had suggested in my diagram.